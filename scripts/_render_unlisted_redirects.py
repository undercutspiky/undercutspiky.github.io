#!/usr/bin/env python3
"""Generate unlisted redirects after Jekyll, outside public Git source and sitemaps."""
import html
import json
import os
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit


def render_redirects(site_dir, configuration):
    root = Path(site_dir).resolve()
    if not (root / 'index.html').is_file():
        raise ValueError('Build the site before adding redirects.')
    mapping = json.loads(configuration)
    if not isinstance(mapping, dict) or not mapping:
        raise ValueError('The redirect configuration must be a nonempty JSON object.')
    outputs = []
    for route, destination in mapping.items():
        if not isinstance(route, str) or not re.fullmatch(r'/[A-Za-z0-9_-]+(?:/[A-Za-z0-9_-]+)*/', route):
            raise ValueError('Each route must be a directory path with a trailing slash.')
        if not isinstance(destination, str) or any(c in destination for c in '\r\n\x00'):
            raise ValueError('Each destination must be a valid HTTPS URL.')
        parsed = urlsplit(destination)
        if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password:
            raise ValueError('Each destination must be a valid HTTPS URL without credentials.')
        output = root / route.strip('/') / 'index.html'
        if output.exists() or (root / (route.strip('/') + '.html')).exists():
            raise ValueError('A redirect would replace an existing public page.')
        parent = output.parent
        while parent != root:
            if parent.exists() and (parent.is_symlink() or not parent.is_dir()):
                raise ValueError('Redirect paths must use ordinary directories.')
            parent = parent.parent
        escaped = html.escape(destination, quote=True)
        script_url = json.dumps(destination, ensure_ascii=True).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
        document = f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">
  <meta name="referrer" content="no-referrer">
  <meta http-equiv="refresh" content="0; url={escaped}">
  <title>Redirecting</title>
  <script>window.location.replace({script_url});</script>
</head>
<body><p><a href="{escaped}" rel="nofollow noreferrer">Continue</a></p></body>
</html>
'''
        outputs.append((output, document))
    for output, document in outputs:
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(document, encoding='utf-8')
    return len(outputs)


def main():
    configuration = os.environ.get('UNLISTED_REDIRECTS_JSON', '')
    if not configuration:
        raise ValueError('Set the private redirect configuration before deploying.')
    count = render_redirects(sys.argv[1] if len(sys.argv) > 1 else '_site', configuration)
    print(f'Added {count} unlisted redirect(s).')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError):
        # Do not expose routes or destinations in public workflow logs.
        sys.exit('Unlisted redirect generation failed. Check the private configuration and output paths.')
