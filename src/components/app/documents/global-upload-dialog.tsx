'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { uploadDocument } from '@/lib/documents/actions'

export type MatterOption = { id: string; file_ref: string; title: string }
export type CategoryOption = { id: string; name: string }

export function GlobalUploadDialog({
  open,
  onOpenChange,
  matters,
  categories,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  matters: MatterOption[]
  categories: CategoryOption[]
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [matterId, setMatterId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (open) {
      setMatterId('')
      setCategoryId('')
      if (fileRef.current) fileRef.current.value = ''
    }
  }, [open])

  const submit = () => {
    if (!matterId) {
      toast.error('Select a matter')
      return
    }
    const file = fileRef.current?.files?.[0]
    if (!file) {
      toast.error('Choose a file')
      return
    }
    const fd = new FormData()
    fd.set('file', file)
    if (categoryId) fd.set('category_id', categoryId)
    startTransition(async () => {
      const { error } = await uploadDocument(matterId, fd)
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Document uploaded')
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light text-brand-navy">
            Upload document
          </DialogTitle>
          <DialogDescription>
            Documents are filed against a matter. Choose one, pick a file, and an
            optional category.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="up_matter">Matter</Label>
            <Select value={matterId} onValueChange={(v) => setMatterId(v ?? '')}>
              <SelectTrigger id="up_matter">
                <SelectValue placeholder="Select a matter" />
              </SelectTrigger>
              <SelectContent>
                {matters.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.file_ref} — {m.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="up_file">File</Label>
            <input
              id="up_file"
              ref={fileRef}
              type="file"
              className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-navy file:px-3 file:py-1.5 file:text-xs file:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="up_cat">Category (optional)</Label>
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? '')}>
              <SelectTrigger id="up_cat">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? 'Uploading…' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
