import frappe
from frappe.tests.utils import FrappeTestCase


class TestSubscriptions(FrappeTestCase):

    def test_app_is_installed(self):
        """Verify that the subscriptions app is installed."""
        installed_apps = frappe.get_installed_apps()

        self.assertIn("legal_management", installed_apps)

    def test_app_module_import(self):
        """Verify that the subscriptions module can be imported."""
        import legal_management

        self.assertIsNotNone(legal_management)
