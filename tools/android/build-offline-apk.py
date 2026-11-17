#!/usr/bin/env python3
"""Package the existing WebView DEX with current offline assets; keys stay outside Git."""
import argparse
from pathlib import Path
import struct
import re
import zipfile


def patch_manifest(data, package, version_code, version_name, label):
    strings = None
    chunks = []
    offset = 8
    while offset < len(data):
        kind, header, size = struct.unpack_from('<HHI', data, offset)
        chunk = data[offset:offset + size]
        if kind == 1:
            count, styles, flags, start, _ = struct.unpack_from('<5I', chunk, 8)
            assert styles == 0, 'Manifest styled strings are unsupported'
            strings = []
            for i in range(count):
                pos = start + struct.unpack_from('<I', chunk, header + 4*i)[0]
                if flags & 256:
                    def length(pos):
                        x = chunk[pos]
                        return ((((x & 127) << 8) | chunk[pos+1]), pos+2) if x & 128 else (x, pos+1)
                    _, pos = length(pos)
                    n, pos = length(pos)
                    text = chunk[pos:pos+n].decode('utf-8')
                else:
                    n = struct.unpack_from('<H', chunk, pos)[0]
                    text = chunk[pos+2:pos+2+2*n].decode('utf-16le')
                strings.append(text)
            strings = [package if s == 'com.zerkalopro.calc' else version_name if s == '27' else s for s in strings]
            label_index = len(strings)
            strings.append(label)
            encoded = b''
            offsets = []
            for text in strings:
                offsets.append(len(encoded))
                if flags & 256:
                    raw = text.encode('utf-8')
                    utf16len = len(text.encode('utf-16le')) // 2
                    def u8len(n):
                        return bytes([n]) if n < 128 else bytes([(n >> 8) | 128, n & 255])
                    encoded += u8len(utf16len) + u8len(len(raw)) + raw + b'\0'
                else:
                    raw = text.encode('utf-16le')
                    encoded += struct.pack('<H', len(raw)//2) + raw + b'\0\0'
            encoded += b'\0' * (-len(encoded) % 4)
            start = header + 4*len(strings)
            chunk = struct.pack('<HHI5I', 1, header, start+len(encoded), len(strings), 0, flags & ~1, start, 0)
            chunk += b''.join(struct.pack('<I', n) for n in offsets) + encoded
        elif kind == 0x102:
            assert strings is not None
            chunk = bytearray(chunk)
            node = strings[struct.unpack_from('<I', chunk, 20)[0]]
            attr_start, attr_size, attr_count = struct.unpack_from('<3H', chunk, 24)
            for i in range(attr_count):
                pos = 16 + attr_start + attr_size*i
                name = strings[struct.unpack_from('<I', chunk, pos+4)[0]]
                if name == 'versionCode':
                    struct.pack_into('<I', chunk, pos+16, version_code)
                if node == 'application' and name == 'label':
                    struct.pack_into('<I', chunk, pos+8, label_index)
                    chunk[pos+15] = 3  # TYPE_STRING
                    struct.pack_into('<I', chunk, pos+16, label_index)
            chunk = bytes(chunk)
        chunks.append(chunk)
        offset += size
    assert offset == len(data)
    return data[:4] + struct.pack('<I', 8 + sum(map(len, chunks))) + b''.join(chunks)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--template', type=Path, required=True)
    parser.add_argument('--assets', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--shared-assets', type=Path)
    parser.add_argument('--package', default='ru.zerkalopro.spbcalculator')
    parser.add_argument('--version-code', type=int, default=1001)
    parser.add_argument('--version-name', default='4.43')
    args = parser.parse_args()
    with zipfile.ZipFile(args.template) as source:
        entries = {n:source.read(n) for n in source.namelist() if not n.startswith(('assets/', 'META-INF/')) and not n.endswith('/')}
    assert 'classes.dex' in entries
    entries['AndroidManifest.xml'] = patch_manifest(entries['AndroidManifest.xml'], args.package, args.version_code, args.version_name, 'Зеркало Pro СПб ' + args.version_name)
    for file in sorted(args.assets.rglob('*')):
        if file.is_file():
            entries['assets/' + file.relative_to(args.assets).as_posix()] = file.read_bytes()
    if args.shared_assets:
        shared = args.shared_assets.resolve()
        html = entries['assets/index.html'].decode('utf-8')
        for reference in re.findall(r'(?:src|href)="([^"#]+)"', html):
            reference = reference.split('?')[0].split('#')[0]
            if not reference.startswith('assets/') or 'assets/'+reference in entries:
                continue
            file = (shared / reference.removeprefix('assets/')).resolve()
            if file.is_relative_to(shared) and file.is_file():
                entries['assets/'+reference] = file.read_bytes()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(args.output, 'w', zipfile.ZIP_DEFLATED) as target:
        for name, value in entries.items():
            info = zipfile.ZipInfo(name, (2026, 11, 17, 12, 0, 0))
            info.compress_type = zipfile.ZIP_STORED if name == 'resources.arsc' else zipfile.ZIP_DEFLATED
            target.writestr(info, value)
    print(args.output)


if __name__ == '__main__':
    main()
