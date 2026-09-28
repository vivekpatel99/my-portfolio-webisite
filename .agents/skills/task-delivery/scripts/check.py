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


def untracked_files(repo):
    paths = git(repo, "ls-files", "--others", "--exclude-standard", "-z")
    files = {}
    for raw in paths.split(b"\0"):
        if not raw:
            continue
        path = repo / os.fsdecode(raw)
        info = path.lstat()
        mode = stat.S_IFMT(info.st_mode) | stat.S_IMODE(info.st_mode)
        if stat.S_ISLNK(info.st_mode):
            content = os.fsencode(os.readlink(path))
        elif stat.S_ISREG(info.st_mode):
            content = path.read_bytes()
        else:
            content = b""
        files[os.fsdecode(raw)] = {"mode": mode, "content": digest(content)}
    return files


def repository_state(repo):
    status = git(repo, "status", "--porcelain=v1", "-z", "--untracked-files=all")
    files = untracked_files(repo)
    state = {
        "index_diff": digest(git(repo, "diff", "--cached", "--binary", "--")),
        "worktree_diff": digest(git(repo, "diff", "--binary", "--")),
        "status": digest(status),
        "untracked": files,
        "submodules": {},
    }
    modules = repo / ".gitmodules"
    if modules.is_file():
        configured = git(repo, "config", "--file", ".gitmodules", "--get-regexp", r"^submodule\..*\.path$").decode()
        for line in configured.splitlines():
            _, module_path = line.split(None, 1)
            module = repo / module_path
            if (module / ".git").exists():
                state["submodules"][module_path] = repository_state(module)
            else:
                state["submodules"][module_path] = {"uninitialized": True}
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
        for name in sorted(set(files) | set(starting["untracked"])):
            if files.get(name) != starting["untracked"].get(name):
                print("Untracked file changed:", name)
        raise SystemExit(1)
    print("Dirty state matches the baseline.")
