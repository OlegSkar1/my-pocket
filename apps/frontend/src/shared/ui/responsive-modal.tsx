"use client";

import * as React from "react";
import { cn, useIsMobile } from "@/shared/lib";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "./drawer";

const MobileContext = React.createContext(false);

interface RootProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

// На десктопе — модалка (Dialog), на мобиле — выезжающий снизу Drawer.
function ResponsiveModal({ open, onOpenChange, children }: RootProps) {
  const isMobile = useIsMobile();
  const Root = isMobile ? Drawer : Dialog;
  return (
    <MobileContext.Provider value={isMobile}>
      <Root open={open} onOpenChange={onOpenChange}>
        {children}
      </Root>
    </MobileContext.Provider>
  );
}

function ResponsiveModalContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const isMobile = React.useContext(MobileContext);
  if (isMobile) {
    return <DrawerContent className={className}>{children}</DrawerContent>;
  }
  return (
    <DialogContent
      className={cn("flex max-h-[85vh] flex-col gap-0 p-0", className)}
    >
      {children}
    </DialogContent>
  );
}

function ResponsiveModalHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-1.5 p-5 pb-2 text-left", className)} {...props} />;
}

function ResponsiveModalFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-auto flex flex-col gap-2 p-5 pt-2", className)} {...props} />
  );
}

function ResponsiveModalTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const isMobile = React.useContext(MobileContext);
  const Title = isMobile ? DrawerTitle : DialogTitle;
  return <Title className={className}>{children}</Title>;
}

function ResponsiveModalDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const isMobile = React.useContext(MobileContext);
  const Description = isMobile ? DrawerDescription : DialogDescription;
  return <Description className={className}>{children}</Description>;
}

export {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalFooter,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
};
