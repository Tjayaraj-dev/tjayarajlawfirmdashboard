'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ActionResult = { error: string | null }

export type WitnessValues = {
  name: string
  role: string
  date_presented: string
  status: string
}
export type ExhibitValues = {
  marking: string
  date_presented: string
  through_witness: string
  description: string
}

async function authed() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, userId: user?.id ?? null }
}

// --- Witnesses ---
export async function createWitness(matterId: string, v: WitnessValues): Promise<ActionResult> {
  if (!v.name.trim()) return { error: 'Witness name is required' }
  const { supabase, userId } = await authed()
  if (!userId) return { error: 'Not authenticated' }
  const { error } = await supabase.from('witnesses').insert({
    matter_id: matterId,
    name: v.name.trim(),
    role: v.role.trim() || null,
    date_presented: v.date_presented || null,
    status: v.status.trim() || null,
    created_by: userId,
  })
  if (error) return { error: error.message }
  revalidatePath(`/defence/${matterId}`)
  return { error: null }
}

export async function updateWitness(id: string, matterId: string, v: WitnessValues): Promise<ActionResult> {
  if (!v.name.trim()) return { error: 'Witness name is required' }
  const { supabase } = await authed()
  const { error } = await supabase
    .from('witnesses')
    .update({
      name: v.name.trim(),
      role: v.role.trim() || null,
      date_presented: v.date_presented || null,
      status: v.status.trim() || null,
    })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/defence/${matterId}`)
  return { error: null }
}

export async function deleteWitness(id: string, matterId: string): Promise<ActionResult> {
  const { supabase } = await authed()
  const { error } = await supabase
    .from('witnesses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/defence/${matterId}`)
  return { error: null }
}

// --- Exhibits ---
export async function createExhibit(matterId: string, v: ExhibitValues): Promise<ActionResult> {
  const { supabase, userId } = await authed()
  if (!userId) return { error: 'Not authenticated' }
  const { error } = await supabase.from('exhibits').insert({
    matter_id: matterId,
    marking: v.marking.trim() || null,
    date_presented: v.date_presented || null,
    through_witness: v.through_witness.trim() || null,
    description: v.description.trim() || null,
    created_by: userId,
  })
  if (error) return { error: error.message }
  revalidatePath(`/defence/${matterId}`)
  return { error: null }
}

export async function updateExhibit(id: string, matterId: string, v: ExhibitValues): Promise<ActionResult> {
  const { supabase } = await authed()
  const { error } = await supabase
    .from('exhibits')
    .update({
      marking: v.marking.trim() || null,
      date_presented: v.date_presented || null,
      through_witness: v.through_witness.trim() || null,
      description: v.description.trim() || null,
    })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/defence/${matterId}`)
  return { error: null }
}

export async function deleteExhibit(id: string, matterId: string): Promise<ActionResult> {
  const { supabase } = await authed()
  const { error } = await supabase
    .from('exhibits')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/defence/${matterId}`)
  return { error: null }
}
