# from frappe.auth import LoginManager
# from erpnext.selling.doctype.sales_order.sales_order import SalesOrder
# from frappe.utils import add_days, cint, cstr, flt, get_link_to_form, getdate, nowdate, strip_html
# import frappe
# from frappe import _

# class CustomLoginManager(LoginManager):
#     def force_user_to_reset_password(self):
#         return True

# class CustomSO(SalesOrder):
#     def validate_po(self):
#         if self.po_date and not self.skip_delivery_note:
#             for d in self.get("items"):
#                 if d.delivery_date and getdate(self.po_date) > getdate(d.delivery_date):
#                     frappe.throw(
#                         _("Row #{0}: Expected Delivery Date cannot be before Purchase Order Date Custom").format(
#                             d.idx
#                         )
#                     )