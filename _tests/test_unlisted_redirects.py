import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

path = Path(__file__).resolve().parents[1] / 'scripts' / '_render_unlisted_redirects.py'
spec = importlib.util.spec_from_file_location('redirects', path)
redirects = importlib.util.module_from_spec(spec)
spec.loader.exec_module(redirects)


class UnlistedRedirectTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.site = Path(self.tmp.name)
        (self.site / 'index.html').write_text('Public home')
        (self.site / 'sitemap.xml').write_text('<urlset/>')
        (self.site / 'robots.txt').write_text('User-agent: *\nAllow: /\n')

    def test_redirect_and_indexing_controls(self):
        url = 'https://example.com/private.pdf?first=1&second=2'
        redirects.render_redirects(self.site, json.dumps({'/private-link/': url}))
        text = (self.site / 'private-link/index.html').read_text()
        self.assertIn('noindex, nofollow', text)
        self.assertIn('window.location.replace(', text)
        self.assertIn('referrer" content="no-referrer', text)
        self.assertIn('rel="nofollow noreferrer"', text)
        self.assertIn('first=1&amp;second=2', text)
        self.assertEqual((self.site / 'sitemap.xml').read_text(), '<urlset/>')
        self.assertNotIn('private-link', (self.site / 'robots.txt').read_text())

    def test_rejects_unsafe_routes_and_urls(self):
        for route, url in [('/../escape/', 'https://example.com/'), ('/', 'https://example.com/'),
                           ('/bad/', 'javascript:alert(1)'), ('/bad/', 'https://user:pass@example.com/')]:
            with self.subTest(route=route), self.assertRaises(ValueError):
                redirects.render_redirects(self.site, json.dumps({route: url}))

    def test_existing_page_is_not_overwritten(self):
        (self.site / 'public').mkdir()
        (self.site / 'public/index.html').write_text('Existing page')
        with self.assertRaises(ValueError):
            redirects.render_redirects(self.site, json.dumps({'/public/': 'https://example.com/'}))
        self.assertEqual((self.site / 'public/index.html').read_text(), 'Existing page')

    def test_cannot_close_script_tag(self):
        redirects.render_redirects(self.site, json.dumps({'/private-link/': 'https://example.com/</script><script>alert(1)</script>'}))
        text = (self.site / 'private-link/index.html').read_text()
        self.assertNotIn('<script>alert(1)', text)
        self.assertIn('\\u003c/script\\u003e', text)

    def test_invalid_later_route_does_not_write_earlier_route(self):
        with self.assertRaises(ValueError):
            redirects.render_redirects(self.site, json.dumps({'/valid/': 'https://example.com/', '/bad/': 'http://example.com/'}))
        self.assertFalse((self.site / 'valid').exists())


if __name__ == '__main__':
    unittest.main()
