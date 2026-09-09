"use client";

import { useState, useEffect, useActionState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteQuiz } from "../actions";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { INITIAL_STATE_ACTION } from "@/constants/general-constant";

type Props = {
  refetch: () => void;
  currentData?: any;
  open?: boolean;
  handleChangeAction?: (open: boolean) => void;
};

export default function DialogDeleteQuiz({ refetch, currentData, open, handleChangeAction }: Props) {
  const action = (prev: any, formData: FormData) => deleteQuiz(prev, formData);
  const [state, formAction] = useActionState(action, INITIAL_STATE_ACTION);

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Berhasil menghapus kuis");
      refetch();
      handleChangeAction?.(false);
    } else if (state.status === "error") {
      toast.error("Gagal menghapus kuis", { description: state.errors?._form?.[0] });
    }
  }, [state]);

  async function onSubmit(e: any) {
    e.preventDefault();
    const formData = new FormData();
    formData.append("id", currentData?.id ?? "");
    await formAction(formData);
  }

  return (
    <Dialog open={open} onOpenChange={handleChangeAction}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus Kuis</DialogTitle>
        </DialogHeader>

        <p>Apakah kamu yakin ingin menghapus kuis "{currentData?.title}"?</p>

        <form onSubmit={onSubmit} className="mt-4">
          <input type="hidden" name="id" value={currentData?.id ?? ""} />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button variant="destructive" type="submit">
              {state?.status === "loading" ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
