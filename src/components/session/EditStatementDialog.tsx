
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface EditStatementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  statement: string;
  description?: string | null;
  onSubmit: (statement: string, description: string | undefined) => void;
}

export const EditStatementDialog: React.FC<EditStatementDialogProps> = ({
  isOpen,
  onClose,
  statement,
  description,
  onSubmit,
}) => {
  const [editedStatement, setEditedStatement] = React.useState(statement);
  const [editedDescription, setEditedDescription] = React.useState(description || "");

  React.useEffect(() => {
    setEditedStatement(statement);
    setEditedDescription(description || "");
  }, [statement, description]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(editedStatement, editedDescription || undefined);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Statement</DialogTitle>
          <DialogDescription>
            Update the statement content and background information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="statement" className="block text-sm font-medium mb-1">
              Statement
            </label>
            <Input
              id="statement"
              value={editedStatement}
              onChange={(e) => setEditedStatement(e.target.value)}
              placeholder="Enter statement"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Background (optional)
            </label>
            <Textarea
              id="description"
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              placeholder="Enter background information"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
