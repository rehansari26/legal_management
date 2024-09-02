# Copyright (c) 2024, Clover Infotech and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class DocumentRevision(Document):
    def before_save(self):
        old_doc = self.get_doc_before_save()
        if not self.is_new() and old_doc and not old_doc.workflow_state == "Draft" and not old_doc.workflow_state == self.workflow_state:
            if self.revised_nda:
                row = self.append('nda_revisions', {})
                row.nda_archive = self.revised_nda
                row.change_status = "Document Changed"
                self.nda_document = self.revised_nda
                self.revised_nda = None
            else:
                row = self.append('nda_revisions', {})
                row.nda_archive = self.nda_document
                row.change_status = "No Change"

@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def role_wise_users(doctype, txt, searchfield, start, page_len, filters, as_dict=False):
    from frappe.desk.reportview import get_match_cond

    doctype = "User"
    role = filters.get("role")  # Get the role from the filters

    if (
        not frappe.get_meta(doctype).get_field(searchfield)
        and searchfield not in frappe.db.DEFAULT_COLUMNS
    ):
        return []

    return frappe.db.sql(
        """SELECT
                DISTINCT `tabUser`.name,
                `tabUser`.full_name
            FROM
                `tabUser`
            INNER JOIN
                `tabHas Role` On `tabUser`.name = `tabHas Role`.parent
            WHERE
                `tabHas Role`.role = %(role)s and
                `tabHas Role`.parenttype = 'User' and
                `tabUser`.name != 'Administrator' and
                `tabUser`.`{key}` like %(txt)s
            {mcond}
        ORDER BY
            if(locate(%(_txt)s, `tabUser`.first_name), locate(%(_txt)s, `tabUser`.first_name), 99999),
            `tabUser`.idx desc, `tabUser`.first_name
        LIMIT
            %(start)s, %(page_len)s """.format(mcond=get_match_cond(doctype), key=searchfield),
        {
            "txt": "%" + txt + "%",
            "_txt": txt.replace("%", ""),
            "start": start,
            "page_len": page_len,
            "role": role  # Pass the dynamic role here
        },
    )