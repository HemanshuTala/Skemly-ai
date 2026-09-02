// E:\Skemly-ai\apps\frontend\src\components\editor\VersionConflictModal.tsx
import React, { useState } from 'react';
import { Modal } from '../ui/modal';
import { AlertTriangle, Download, RefreshCw, Save, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

interface VersionConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverVersion?: number;
  clientVersion?: number;
  onKeepChanges: () => Promise<void>;
  onLoadServerVersion: () => Promise<void>;
  onExportLocalBackup: () => void;
}

export const VersionConflictModal: React.FC<VersionConflictModalProps> = ({
  isOpen,
  onClose,
  serverVersion = 1,
  clientVersion = 1,
  onKeepChanges,
  onLoadServerVersion,
  onExportLocalBackup,
}) => {
  const [isBusy, setIsBusy] = useState(false);

  const handleKeep = async () => {
    try {
      setIsBusy(true);
      await onKeepChanges();
      toast.success('Local changes preserved & updated');
      onClose();
    } catch (err: any) {
      toast.error('Failed to preserve changes: ' + (err.message || 'Unknown error'));
    } finally {
      setIsBusy(false);
    }
  };

  const handleLoadServer = async () => {
    try {
      setIsBusy(true);
      await onLoadServerVersion();
      toast.success('Loaded latest server version');
      onClose();
    } catch (err: any) {
      toast.error('Failed to load server version: ' + (err.message || 'Unknown error'));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Diagram Changed Elsewhere"
      description="A newer version of this diagram exists on the server. Your unsaved changes are preserved safely."
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-semibold text-white">Version Mismatch Detected</p>
            <p className="text-[#a1a1aa] mt-0.5">
              Server is at v{serverVersion}, while your client sent v{clientVersion}.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleKeep}
            disabled={isBusy}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs transition-all border border-violet-400/20 disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              <span>Keep My Changes (Save as v{serverVersion + 1})</span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleLoadServer}
            disabled={isBusy}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white font-medium text-xs transition-all border border-white/[0.08] disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span>Load Server Version (Backup draft locally first)</span>
            </div>
          </button>

          <button
            type="button"
            onClick={onExportLocalBackup}
            disabled={isBusy}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-transparent hover:bg-white/[0.04] text-[#a1a1aa] hover:text-white font-medium text-xs transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Local JSON Backup</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
