import { z } from 'zod'

export const clientFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(200),
    type: z.enum(['individual', 'corporate']),
    ic_or_company_no: z.string().trim().max(100).optional(),
    reference_no: z.string().trim().max(100).optional(),
    phone: z.string().trim().max(60).optional(),
    email: z.string().trim().max(200).optional(),
    address: z.string().trim().max(500).optional(),
    // Optional "open a case file" section — creates the client's first matter.
    case_file_ref: z.string().trim().max(100).optional(),
    case_type_id: z.string().uuid().optional().or(z.literal('')),
    case_details: z.string().trim().max(2000).optional(),
  })
  .refine(
    (v) => !(v.case_details || v.case_type_id) || !!v.case_file_ref,
    { message: 'A case file reference is required to open a case', path: ['case_file_ref'] }
  )

export type ClientFormValues = z.infer<typeof clientFormSchema>

export const emptyClientForm: ClientFormValues = {
  name: '',
  type: 'individual',
  ic_or_company_no: '',
  reference_no: '',
  phone: '',
  email: '',
  address: '',
  case_file_ref: '',
  case_type_id: '',
  case_details: '',
}
