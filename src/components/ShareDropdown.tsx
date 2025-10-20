"use client";

import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { useCallback, useState, type PropsWithChildren } from "react";
import {
  PiCheckBold,
  PiCircleNotchBold,
  PiCopyBold,
  PiXBold,
} from "react-icons/pi";

interface Props extends PropsWithChildren {
  permalink: string;
}

export default function ShareDropdown({ children, permalink }: Props) {
  const [copyState, setCopyState] = useState<
    "closed" | "pristine" | "pending" | "success" | "error"
  >("closed");

  const copyLink = useCallback(
    (e: Event) => {
      e.preventDefault();
      setCopyState("pending");

      navigator.clipboard
        .writeText(permalink)
        .then(() => {
          setCopyState((s) => (s === "pending" ? "success" : s));
        })
        .catch((err) => {
          console.error(err);
          setCopyState((s) => (s === "pending" ? "error" : s));
        });
    },
    [permalink],
  );

  const handleOpenChange = useCallback((shouldOpen: boolean) => {
    setCopyState(shouldOpen ? "pristine" : "closed");
  }, []);

  return (
    <Dropdown.Root
      open={copyState !== "closed"}
      onOpenChange={handleOpenChange}
    >
      <Dropdown.Trigger asChild suppressHydrationWarning>
        {children}
      </Dropdown.Trigger>

      <Dropdown.Portal>
        <Dropdown.Content
          className="z-50 flex min-w-32 flex-col rounded-md border border-gray-400 bg-white py-1 text-xs shadow-xl"
          align="start"
          sideOffset={4}
          alignOffset={4}
        >
          <Dropdown.Item
            className="group flex cursor-default items-center gap-2 py-1 pr-4 pl-2 transition-colors data-[state=pristine]:hover:bg-gray-200"
            disabled={copyState !== "pristine"}
            data-state={copyState}
            onSelect={copyLink}
          >
            <span className="hidden font-medium text-gray-800 group-[[data-state=pristine]]:contents">
              <PiCopyBold className="text-gray-600" />
              Copy Link
            </span>
            <span className="hidden font-medium text-gray-600 group-[[data-state=pending]]:contents">
              <PiCircleNotchBold className="animate-spin text-gray-400" />
              Copying...
            </span>
            <span className="hidden font-medium text-green-700 group-[[data-state=success]]:contents">
              <PiCheckBold className="opacity-80" />
              Copied!
            </span>
            <span className="hidden font-medium text-red-700 group-[[data-state=error]]:contents">
              <PiXBold className="opacity-80" />
              Unable to copy
            </span>
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
