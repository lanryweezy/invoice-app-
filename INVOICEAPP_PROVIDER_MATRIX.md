# INVOICEAPP.NG - Provider Capability Matrix

| Capability | Paystack | Flutterwave | NRS |
|---|---|---|---|
| Payments | [VERIFIED] | [NOT IMPLEMENTED] | N/A |
| Payment Links | [IMPLEMENTED] | [NOT IMPLEMENTED] | N/A |
| Bank Transfer | [VERIFIED] | [NOT IMPLEMENTED] | N/A |
| Virtual Accounts | [IMPLEMENTED] | [NOT IMPLEMENTED] | N/A |
| Refunds | [NOT IMPLEMENTED] | [NOT IMPLEMENTED] | N/A |
| Webhooks | [IMPLEMENTED] | [NOT IMPLEMENTED] | [NOT IMPLEMENTED] |
| E-Invoice | N/A | N/A | [IMPLEMENTED] |
| Invoice Transmission | N/A | N/A | [IMPLEMENTED] |
| Tax Compliance | [NOT IMPLEMENTED] | [NOT IMPLEMENTED] | [IMPLEMENTED] |

*Note: Paystack webhooks are stubbed in Firebase Functions but require further hardening for robust reconciliation. Flutterwave adapter does not exist in the current codebase.*
