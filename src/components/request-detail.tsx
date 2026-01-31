'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  Clock,
  Calendar,
  User,
  ImageIcon,
  Hash,
  ZoomIn,
  X,
  Sparkles,
} from 'lucide-react';
import type { RequestModel } from '@/types/graphql';

interface RequestDetailProps {
  request: RequestModel;
}

export function RequestDetail({ request }: RequestDetailProps) {
  const [imageZoomed, setImageZoomed] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Card className="overflow-hidden border-border/50 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border/30 bg-muted/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ImageIcon className="h-5 w-5" />
            </div>
            <h3 className="m-0 text-xl font-semibold leading-none tracking-tight">Request Details</h3>
          </div>
          <div className="flex items-center gap-2">
            {request.goldenStatus === 'PUBLISHED' && (
              <Badge className="bg-amber-50 text-amber-800 border-amber-200 shadow-sm">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Golden
              </Badge>
            )}
            {request.isCurated ? (
              <Badge className="bg-success text-success-foreground shadow-sm badge-glow-success">
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Curated
              </Badge>
            ) : (
              <Badge variant="secondary" className="shadow-sm">
                <Clock className="mr-1.5 h-3.5 w-3.5" />
                Pending Curation
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="space-y-4 pt-4 pb-5">
          {/* Image */}
          <button
            type="button"
            onClick={() => request.imageURL && setImageZoomed(true)}
            className="image-container relative h-44 w-full rounded-xl border border-border/50 overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 transition-all"
            disabled={!request.imageURL}
          >
            {request.imageURL ? (
              <>
                <Image
                  src={request.imageURL}
                  alt="Request image"
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  unoptimized
                />
                {/* Zoom overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg">
                    <ZoomIn className="h-5 w-5 text-gray-700" />
                  </div>
                </div>
                {/* Click hint */}
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Click to zoom
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/20">
                <ImageIcon className="h-8 w-8" />
                <span className="text-sm">No image available</span>
              </div>
            )}
          </button>

          {/* Metadata */}
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
              <Calendar className="h-4 w-4 text-primary" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Created</span>
                <span className="text-sm font-medium">{formatDate(request.createdAt)}</span>
              </div>
            </div>

            {request.curatedAt && (
              <div className="flex items-center gap-3 rounded-lg bg-success/10 px-3 py-2.5">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Curated</span>
                  <span className="text-sm font-medium">{formatDate(request.curatedAt)}</span>
                </div>
              </div>
            )}

            {request.curatedBy && (
              <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
                <User className="h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Curated By</span>
                  <span className="text-sm font-medium">
                    {request.curatedBy.firstname} {request.curatedBy.lastname}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
              <div className="flex h-4 w-4 items-center justify-center">
                <div className={`h-2.5 w-2.5 rounded-full ${
                  request.status === 'COMPLETED' ? 'bg-success' :
                  request.status === 'FAILED' ? 'bg-destructive' :
                  'bg-warning'
                }`} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Status</span>
                <span className="text-sm font-medium capitalize">{request.status.toLowerCase()}</span>
              </div>
            </div>
          </div>

          {/* Request ID */}
          <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
            <Hash className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Request ID</span>
              <span className="font-mono text-xs text-muted-foreground">{request.id}</span>
            </div>
          </div>

          {request.aiResponseText && (
            <details className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2 text-sm">
              <summary className="cursor-pointer select-none text-sm font-medium text-foreground/80">
                AI Snapshot{request.aiModel ? ` (${request.aiModel})` : ''}
              </summary>
              <pre className="mt-2 max-h-56 overflow-auto rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                {request.aiResponseText}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>

      {/* Full-screen Image Zoom Dialog */}
      <Dialog open={imageZoomed} onOpenChange={setImageZoomed}>
        <DialogContent
          className="!max-w-none !w-auto !p-0 !border-0 !bg-transparent !shadow-none !gap-0"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Request Image - Full View</DialogTitle>

          {/* Image with close button */}
          <div className="relative">
            {request.imageURL && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={request.imageURL}
                alt="Request image - Full view"
                className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
              />
            )}
            {/* Close button */}
            <button
              onClick={() => setImageZoomed(false)}
              className="absolute top-3 right-3 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors backdrop-blur-sm"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
