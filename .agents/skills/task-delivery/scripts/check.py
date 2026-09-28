#!/usr/bin/env python3
import argparse
import hashlib
import json
import os
from pathlib import Path
import stat
import subprocess

parser = argparse.ArgumentParser(description="Compare dirty state with a task's starting baseline.")
parser.add_argument("mode", choices=["snapshot", "check"])
parser.add_argument("baseline", type=Path)
args = parser.parse_args()
root = Path(subprocess.check_output(["git", "rev-parse", "--show-toplevel"], text=True).strip())
baseline = args.baseline.resolve()
if baseline.is_relative_to(root):
    parser.error("Store the baseline outside the repository.")

def git(repo, *arguments):
    return subprocess.check_output(["git", "-C", str(repo), *arguments])


def digest(value):
    return hashlib.sha256(value).hexdigest()


def file_state(path):
    info = path.lstat()
    mode = stat.S_IFMT(info.st_mode) | stat.S_IMODE(info.st_mode)
    if stat.S_ISLNK(info.st_mode):
        content = os.fsencode(os.readlink(path))
    elif stat.S_ISREG(info.st_mode):
        content = path.read_bytes()
    else:
        content = b""
    return {"mode": mode, "content": digest(content)}


def filesystem_tree(directory):
    entries = {}

    def visit(current):
        for entry in os.scandir(current):
            path = Path(entry.path)
            relative = path.relative_to(directory).as_posix()
            entries[relative] = file_state(path)
            if entry.is_dir(follow_symlinks=False):
                visit(path)

    visit(directory)
    return entries


def is_repository(directory):
    try:
        root = Path(git(directory, "rev-parse", "--show-toplevel").decode().strip())
    except subprocess.CalledProcessError:
        return False
    return root.resolve() == directory.resolve()


def untracked_files(repo):
    paths = git(repo, "ls-files", "--others", "--exclude-standard", "-z")
    files = {}
    for raw in paths.split(b"\0"):
        if not raw:
            continue
        path = repo / os.fsdecode(raw)
        record = file_state(path)
        info = path.lstat()
        if stat.S_ISDIR(info.st_mode):
            if is_repository(path):
                record["repository"] = repository_state(path)
            else:
                record["tree"] = filesystem_tree(path)
        files[os.fsdecode(raw)] = record
    return files


def is_dirty(state):
    empty_digest = digest(b"")
    return (
        state["index_diff"] != empty_digest
        or state["worktree_diff"] != empty_digest
        or state["status"] != empty_digest
        or bool(state["untracked"])
        or bool(state["submodules"])
    )


def assume_unchanged_files(repo):
    entries = git(repo, "ls-files", "-v", "-z")
    flagged = {}
    for entry in entries.split(b"\0"):
        if len(entry) < 3 or not entry[:1].islower():
            continue
        path = repo / os.fsdecode(entry[2:])
        try:
            flagged[os.fsdecode(entry[2:])] = file_state(path)
        except FileNotFoundError:
            flagged[os.fsdecode(entry[2:])] = {"missing": True}
    return flagged


def submodule_paths(repo):
    paths = set()
    for entry in git(repo, "ls-tree", "-r", "-z", "HEAD").split(b"\0"):
        if not entry:
            continue
        metadata, raw_path = entry.split(b"\t", 1)
        if metadata.startswith(b"160000 "):
            paths.add(os.fsdecode(raw_path))
    for entry in git(repo, "ls-files", "--stage", "-z").split(b"\0"):
        if not entry:
            continue
        metadata, raw_path = entry.split(b"\t", 1)
        if metadata.startswith(b"160000 "):
            paths.add(os.fsdecode(raw_path))
    modules = repo / ".gitmodules"
    if modules.is_file():
        configured = subprocess.run(
            ["git", "-C", str(repo), "config", "--file", ".gitmodules", "--get-regexp", r"^submodule\..*\.path$"],
            capture_output=True,
            check=False,
        )
        if configured.returncode not in (0, 1):
            raise subprocess.CalledProcessError(configured.returncode, configured.args, configured.stdout, configured.stderr)
        for line in configured.stdout.decode().splitlines():
            _, module_path = line.split(None, 1)
            paths.add(module_path)
    return paths


def repository_state(repo):
    status = git(repo, "-c", "core.fileMode=true", "status", "--porcelain=v1", "-z", "--untracked-files=all")
    files = untracked_files(repo)
    state = {
        "index_diff": digest(git(repo, "-c", "core.fileMode=true", "diff", "--no-ext-diff", "--cached", "--binary", "--")),
        "worktree_diff": digest(git(repo, "-c", "core.fileMode=true", "diff", "--no-ext-diff", "--binary", "--")),
        "status": digest(status),
        "untracked": files,
        "assume_unchanged": assume_unchanged_files(repo),
        "submodules": {},
    }
    for module_path in submodule_paths(repo):
        module = repo / module_path
        if (module / ".git").exists():
            child_state = repository_state(module)
            if is_dirty(child_state):
                state["submodules"][module_path] = child_state
        elif module.is_dir():
            files = filesystem_tree(module)
            if files:
                state["submodules"][module_path] = {"uninitialized_files": files}
    return state


state = {"repository": str(root), **repository_state(root)}
if args.mode == "snapshot":
    with baseline.open("x") as output:
        json.dump(state, output, indent=2, sort_keys=True)
    print("Starting dirty state recorded.")
else:
    starting = json.loads(baseline.read_text())
    if state != starting:
        print("Dirty state differs from the baseline. Inspect git status and git diff.")
        for name in sorted(set(state["untracked"]) | set(starting["untracked"])):
            if state["untracked"].get(name) != starting["untracked"].get(name):
                print("Untracked file changed:", name)
        raise SystemExit(1)
    print("Dirty state matches the baseline.")
