#!/usr/bin/env python3
"""Apply the isolated client-control helper ONLY to reviewed LostCityRS Client-Java 377.

Does not patch an active JoshRS runtime, does not change any server or saves,
and fails closed unless its original Client.java exactly matches the pinned
upstream Git blob. --check reads only.
"""
import argparse
import hashlib
import pathlib
import subprocess
import sys

SOURCE_SHA = '0fc9ef32991a903d10da8c7ad53e797adc706b05'
FIELD = '    public final JoshRS377ClientControl joshRS377ClientControl = new JoshRS377ClientControl();'
HOOK = '        this.joshRS377ClientControl.pump(this);'
SOURCE_FILE = 'src/main/java/jagex2/client/Client.java'
HELPER_FILE = 'src/main/java/jagex2/client/JoshRS377ClientControl.java'

def gitblob(path: pathlib.Path) -> str:
    result = subprocess.run(['git','hash-object',str(path)],check=True,
                            capture_output=True,text=True)
    return result.stdout.strip()

def patch(client: pathlib.Path, helper: pathlib.Path, apply: bool=False):
    java = client / SOURCE_FILE
    target = client / HELPER_FILE
    if not java.is_file():
        raise RuntimeError('Missing original pinned 377 Client.java')
    source = java.read_text(encoding='utf-8')
    pinned = gitblob(java)
    own_helper = pathlib.Path(__file__).parent / 'JoshRS377ClientControl.java'
    if not own_helper.is_file():
        raise RuntimeError('Missing reviewed helper source')
    if FIELD in source or HOOK in source:
        if FIELD not in source or HOOK not in source or not target.is_file() or \
           target.read_bytes() != own_helper.read_bytes():
            raise RuntimeError('Partially patched or unknown client: do not overwrite')
        print('CLIENT_377_ALREADY_PATCHED: exact helper and both hooks present')
        return
    if pinned != SOURCE_SHA:
        raise RuntimeError('Original client source SHA mismatch; no files touched')
    a = '\tpublic int selectedTab = 3;'
    b = '\t\tloopCycle++;\n'
    if source.count(a) != 1 or source.count(b) != 1:
        raise RuntimeError('Expected original source anchors missing; no changes')
    if target.exists():
        raise RuntimeError('Existing local helper is not owned by this patch')
    if not apply:
        print('CLIENT_377_READ_ONLY_CHECK_PASSED: exact upstream sha, both patch anchors, no files changed')
        return
    updated = source.replace(a, a + '\n' + FIELD, 1)
    updated = updated.replace(b, b + '\n' + HOOK + '\n', 1)
    # Do not write any file until all preview assertions have passed.
    if updated.count(FIELD) != 1 or updated.count(HOOK) != 1:
        raise RuntimeError('Client patch injection failed preflight')
    # Target only a disposable checkout: an explicit marker created by CI/user.
    marker = client / '.joshrs-isolated-client-control-ok'
    if not marker.is_file() or marker.read_text(encoding='ascii').strip() != 'isolated-test-only':
        raise RuntimeError('Missing explicit disposable checkout marker; refusing patch')
    target.parent.mkdir(parents=True, exist_ok=True)
    # Installation is reversible without overwriting original upstream.
    backup = client / 'Client.java.before-JoshRS377ClientControl'
    if backup.exists():
        raise RuntimeError('Backup already exists: refusing to overwrite')
    backup.write_bytes(java.read_bytes())
    try:
        target.write_bytes(own_helper.read_bytes())
        java.write_text(updated,encoding='utf-8')
    except Exception:
        java.write_bytes(backup.read_bytes())
        if target.exists(): target.unlink()
        raise
    print('CLIENT_377_LOCAL_CONTROLS_PATCHED: Java tab and design controller compiled separately; no live game modified')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--client',type=pathlib.Path,required=True)
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--check',action='store_true')
    group.add_argument('--apply',action='store_true')
    args = parser.parse_args()
    if args.check == args.apply:
        parser.error('Choose exactly --check or --apply')
    try:
        patch(args.client,args.client,args.apply)
    except (RuntimeError,OSError,subprocess.CalledProcessError) as exc:
        print('CLIENT_377_PATCH_REFUSED:',exc,file=sys.stderr)
        sys.exit(1)
