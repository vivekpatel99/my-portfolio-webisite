#!/usr/bin/env python3
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser(description="Compare dirty state with a task's starting baseline.")
parser.add_argument("mode", choices=["snapshot", "check"])
parser.add_argument("baseline", type=Path)
args = parser.parse_args()
root = Path(subprocess.check_output(["git", "rev-parse", "--show-toplevel"], text=True).strip())
baseline = args.baseline.resolve()
if baseline.is_relative_to(root):
    parser.error("Store the baseline outside the repository.")

os.chdir(root)
diff = subprocess.check_output(["git", "diff", "--binary", "HEAD", "--"])
status = subprocess.check_output(["git", "status", "--porcelain=v1", "-z", "--untracked-files=all"])
untracked = subprocess.check_output(["git", "ls-files", "--others", "--exclude-standard", "-z"])
files = {}
for raw in untracked.split(b"\0"):
    if not raw:
        continue
    path = Path(os.fsdecode(raw))
    content = os.fsencode(os.readlink(path)) if path.is_symlink() else path.read_bytes()
    files[os.fsdecode(raw)] = hashlib.sha256(content).hexdigest()

state = {
    "repository": str(root),
    "diff": hashlib.sha256(diff).hexdigest(),
    "status": hashlib.sha256(status).hexdigest(),
    "untracked": files,
}
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
