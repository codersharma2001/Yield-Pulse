"use client";

import { ExternalLink } from "lucide-react";
import type { ProtocolMetadata } from "@yield-dashboard/sdk";

interface ProtocolBadgeProps {
  protocol: ProtocolMetadata;
  showIcon?: boolean;
  className?: string;
}

export function ProtocolBadge({
  protocol,
  showIcon = true,
  className = "",
}: ProtocolBadgeProps) {
  return (
    <a
      href={protocol.vaultUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium transition-colors hover:bg-neutral-800 hover:text-white ${className}`}
      title={`View on ${protocol.name}`}
    >
      <span>{protocol.name}</span>
      {showIcon && <ExternalLink className="h-3.5 w-3.5" />}
    </a>
  );
}

interface ProtocolLinkProps {
  protocol: ProtocolMetadata;
  className?: string;
}

export function ProtocolLink({ protocol, className = "" }: ProtocolLinkProps) {
  return (
    <a
      href={protocol.websiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-white transition-colors ${className}`}
    >
      <span>{protocol.name}</span>
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}
