// Copyright (c) 2024, Clover Infotech and contributors
// For license information, please see license.txt

frappe.ui.form.on('Document Revision', {
	// before_workflow_action: async function(frm) {
	// 	if (frm.selected_workflow_action === "Reject") {

    //         // Reject Email Condition
    //         if (frm.doc.workflow_state == "Legal Review Pending"){
    //             frm.set_value("is_reject", 1)
    //             await frm.save()
    //         }
    //         // let child = frm.add_child('archives');
	//         // child.nda_archive = frm.doc.nda_document
	//         // await frm.save()
	// 	}
	// },
    before_workflow_action: async function(frm) {
        if (frm.selected_workflow_action === "Reject") {

            // Create a dialog
            let dialog = new frappe.ui.Dialog({
                title: 'Provide Reason for Rejection',
                fields: [
                    {
                        label: 'Reject Reason',
                        fieldname: 'reason',
                        fieldtype: 'Small Text',
                        reqd: 1
                    }
                ],
                primary_action_label: 'Submit',
                primary_action: function(data) {
                    // Handle the input from the dialog
                    // frappe.msgprint('Reason provided: ' + data.reason);
                    frappe.call({
                        method: "frappe.desk.form.utils.add_comment",
                        args: {
                            reference_doctype: "Document Revision",
                            reference_name: frm.doc.name,
                            content: data.reason,
                            comment_email: frappe.session.user,
                            comment_by: frappe.session.user_fullname,
                        },
                        callback: function(response) {
                            // Refresh the form after adding the comment
                            frm.reload_doc();
                        }
                    });
                    // frm.set_value('customer_name', data.next_workflow)
                    
                    // Close the dialog
                    dialog.hide();
                }
            });

            // Show the dialog
            dialog.show();
        }
    },
    // nda_document:function(frm) {
    //     // Define your custom clear_attachment method
    //     apply_custom_clear_attachment();
        
    //     if (!frm.ndaAttached) {
    //         attachmentClearingListener(frm, 'nda_document');
    //         frm.ndaAttached = true;
    //     }
    // },
	// refresh: function(frm){
    //     frm.trigger('nda_document');

    //     const fieldRoleMapping = {
    //         'sales_user': 'Sales User',
    //         'delivery_user': 'Delivery User',
    //         'dep_user': 'DEP User',
    //         'finance_user': 'Accounts User',
    //         'legal_user': 'Legal User',
    //         'management_user': 'Management'
    //     };

    //     Object.entries(fieldRoleMapping).forEach(([fieldName, role]) => {
    //         frm.set_query(fieldName, () => {
    //             return {
    //                 query: "revision_management.revision_management.doctype.document_revision.document_revision.role_wise_users",
    //                 filters: {
    //                     'role': role
    //                 }
    //             };
    //         });
    //     });

    //     if (!frm.is_new() && frm.doc.workflow_state !== "Draft" && frm.doc.status == "Under Review"){
    //         frm.set_df_property('sales_user', 'read_only', 1);
    //         frm.set_df_property('delivery_user', 'read_only', 1);
    //         frm.set_df_property('dep_user', 'read_only', 1);
    //         frm.set_df_property('finance_user', 'read_only', 1);
    //         frm.set_df_property('legal_user', 'read_only', 1);
    //         frm.set_df_property('management_user', 'read_only', 1);
    //     }

    //     updateDocumentBasedOnUser(frm);

	// }
})

// Define the custom method
function custom_clear_attachment() {
    console.log("Custom clear_attachment method is loaded and executed");

    if (this.frm) {
        this.parse_validate_and_set_in_model(null);
        this.refresh();
        this.frm.doc.docstatus === 1 ? this.frm.save("Update") : this.frm.save();
    } else {
        this.dataurl = null;
        this.fileobj = null;
        this.set_input(null);
        this.parse_validate_and_set_in_model(null);
        this.refresh();
    }

    // Optionally restore the original method here if needed
    restore_default_clear_attachment();
}

// Backup the original method
let original_clear_attachment = frappe.ui.form.ControlAttach.prototype.clear_attachment;

// Apply the custom method
function apply_custom_clear_attachment() {
    frappe.ui.form.ControlAttach.prototype.clear_attachment = custom_clear_attachment;
}

// Restore the original method
function restore_default_clear_attachment() {
    frappe.ui.form.ControlAttach.prototype.clear_attachment = original_clear_attachment;
}

function attachmentClearingListener(frm, field) {
    frm.fields_dict[field].$wrapper.on('mousedown', '[data-action="clear_attachment"]', function() {
        function clearAttachmentOnce() {
            let oldAttachment = frm.doc[field];
            if (oldAttachment) {
				let child = frm.add_child('archives');
			    child.nda_archive = oldAttachment;
            }
            $(this).off('click', clearAttachmentOnce);
        }
        
        $(this).one('click', clearAttachmentOnce);
    });
}

function check_write_permissions(frm) {
    const fieldRoleMapping = {
        'sales_user': 'Sales User',
        'delivery_user': 'Delivery User',
        'dep_user': 'DEP User',
        'finance_user': 'Accounts User',
        'legal_user': 'Legal User',
        'management_user': 'Management'
    };

    frappe.call('revision_management.revision_management.doctype.document_revision.document_revision.check_document_write_permissions', {
        document_revision: frm.doc.name,
        user_id: frappe.session.user
    }).then(r => {
        console.log(r)
    })
}

function updateDocumentBasedOnUser(frm) {
    // Define the list of user field names
    const userList = ['sales_user', 'delivery_user', 'dep_user', 'finance_user', 'legal_user', 'management_user'];

    // Initialize an empty array to store the user values
    let userValues = [];

    // Loop through the list of user fields and populate the userValues array
    userList.forEach(field => {
        let fieldValue = frm.doc[field];
        if (fieldValue) {
            userValues.push(fieldValue);
        }
    });

    // Check if the current session user is in the userValues array
    if (frm.doc.sales_user == frappe.session.user && frm.doc.workflow_state == "Sales Review Pending") {
        frm.set_df_property('nda_document', 'read_only', 0);
    } 
    else if(frm.doc.delivery_user == frappe.session.user && frm.doc.workflow_state == "Delivery Review Pending") {
        frm.set_df_property('nda_document', 'read_only', 0);
    }
    else if(frm.doc.dep_user == frappe.session.user && frm.doc.workflow_state == "DEP Review Pending") {
        frm.set_df_property('nda_document', 'read_only', 0);
    }
    else if(frm.doc.finance_user == frappe.session.user && frm.doc.workflow_state == "Finance Review Pending") {
        frm.set_df_property('nda_document', 'read_only', 0);
    }
    else if(frm.doc.legal_user == frappe.session.user && frm.doc.workflow_state == "Legal Review Pending") {
        frm.set_df_property('nda_document', 'read_only', 0);
    }
    else if(frm.doc.management_user == frappe.session.user && frm.doc.workflow_state == "Management Review Pending") {
        frm.set_df_property('nda_document', 'read_only', 0);
    }
    else {
        if (!frm.is_new() && frm.doc.workflow_state !== "Draft"){
            frm.set_df_property('nda_document', 'read_only', 1);
        }
    }
}
