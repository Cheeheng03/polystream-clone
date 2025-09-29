import React, { useRef, useState } from "react";
import { FiFilter, FiChevronDown } from "react-icons/fi";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export interface Transaction {
  id: string;
  type: "deposit" | "withdraw" | "yield" | "swap" | "transfer-in" | "transfer-out";
  date: string;
  amount: number;
  token: string;
  vaultName?: string;
  status: "completed" | "pending" | "failed";
  // New fields for swap transactions
  swapDetails?: {
    inputToken: string;
    outputToken: string;
    inputAmount: number;
    outputAmount: number;
    priceImpact?: string;
  };
}

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const transactionTypes = ["All", "Deposit", "Withdraw", "Yield", "Swap", "Received", "Sent"];
const transactionStatuses = ["All", "Completed", "Pending", "Failed"];
const vaultNames = ["All", "Stable Yield", "ETH Staking", "BTC Strategy"];
const dateRanges = ["All Time", "Last 7 Days", "Last 30 Days", "Last 90 Days"];

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    setIsScrolling(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current) return;

    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = touchX - touchStartX.current;
    const deltaY = touchY - touchStartY.current;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setIsScrolling(true);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    }
  };

  const handleTouchEnd = () => {
    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);

    touchStartX.current = 0;
    touchStartY.current = 0;
  };

  const handleBadgeClick = (e: React.MouseEvent) => {
    const touchDuration = Date.now() - touchStartTime.current;

    if (touchDuration < 200 && !isScrolling) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
  };

  const getStatusColor = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-500";
      case "pending":
        return "text-secondary-foreground";
      case "failed":
        return "text-primary";
      default:
        return "text-muted-foreground";
    }
  };

  const getTransactionIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "deposit":
        return (
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100">
            <svg
              className="w-4 h-4 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
        );
      case "withdraw":
        return (
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20">
            <svg
              className="w-4 h-4 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 12H4"
              />
            </svg>
          </div>
        );
      case "yield":
        return (
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100">
            <svg
              className="w-4 h-4 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
      case "swap":
        return (
         <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        );
      case "transfer-in":
        return (
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100">
            <svg
              className="w-4 h-4 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
        );
      case "transfer-out":
        return (
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20">
            <svg
              className="w-4 h-4 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 12H4"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted">
            <svg
              className="w-4 h-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
    }
  };

  const formatAmount = (amount: number, type: Transaction["type"], transaction?: Transaction) => {
    // For swap transactions, show the output amount without +/-
    if (type === "swap") {
      return `${amount.toLocaleString()} `;
    }

    let sign;
    if (type === "deposit" || type === "yield" || type === "transfer-in") {
      sign = "+";
    } else if (type === "withdraw" || type === "transfer-out") {
      sign = "-";
    } else {
      sign = "";
    }
    return `${sign}${amount.toLocaleString()} `;
  };

  const getTransactionLabel = (tx: Transaction) => {
    if (tx.type === "swap" && tx.swapDetails) {
      return `Swap ${tx.swapDetails.inputToken} → ${tx.swapDetails.outputToken}`;
    }
    
    switch (tx.type) {
      case "transfer-in": return "Received";
      case "transfer-out": return "Sent";
      default: return tx.type.charAt(0).toUpperCase() + tx.type.slice(1);
    }
  };

  const getAmountColor = (type: Transaction["type"]) => {
    if (type === "swap") {
      return "text-primary";
    }
    
    if (type === "deposit" || type === "yield" || type === "transfer-in") {
      return "text-green-500";
    } else {
      return "text-primary";
    }
  };

  return (
    <div className="w-full">
      {/* Filter Badges */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar touch-pan-x"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Badge
          variant="secondary"
          className="flex items-center gap-1.5 px-3 py-1.5 whitespace-nowrap select-none"
        >
          <FiFilter className="w-4 h-4" />
          Filters
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Badge
              variant="secondary"
              className="flex items-center gap-1.5 px-3 py-1.5 whitespace-nowrap select-none"
              onClick={handleBadgeClick}
            >
              Type
              <FiChevronDown className="w-4 h-4" />
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {transactionTypes.map((type) => (
              <DropdownMenuItem key={type}>{type}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Badge
              variant="secondary"
              className="flex items-center gap-1.5 px-3 py-1.5 whitespace-nowrap select-none"
              onClick={handleBadgeClick}
            >
              Status
              <FiChevronDown className="w-4 h-4" />
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {transactionStatuses.map((status) => (
              <DropdownMenuItem key={status}>{status}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Badge
              variant="secondary"
              className="flex items-center gap-1.5 px-3 py-1.5 whitespace-nowrap select-none"
              onClick={handleBadgeClick}
            >
              Vaults
              <FiChevronDown className="w-4 h-4" />
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {vaultNames.map((vault) => (
              <DropdownMenuItem key={vault}>{vault}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Badge
              variant="secondary"
              className="flex items-center gap-1.5 px-3 py-1.5 whitespace-nowrap select-none"
              onClick={handleBadgeClick}
            >
              Date
              <FiChevronDown className="w-4 h-4" />
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {dateRanges.map((range) => (
              <DropdownMenuItem key={range}>{range}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Transactions list */}
      <div className="space-y-0 divide-y divide-border">
        {transactions.length > 0 ? (
          transactions.map((tx) => (
            <div key={tx.id} className="flex items-center py-4 w-full">
              {getTransactionIcon(tx.type)}
              <div className="ml-3 flex-1">
                <div className="flex justify-between w-full">
                  <div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-foreground">
                        {getTransactionLabel(tx)}
                      </span>
                      <span
                        className={`ml-2 text-xs px-1.5 py-0.5 rounded-full bg-muted ${getStatusColor(
                          tx.status
                        )}`}
                      >
                        {tx.status}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-muted-foreground">
                        {tx.date}
                      </span>
                      {tx.type !== "swap" && (
                        <>
                          <span className="mx-1 text-xs text-muted-foreground">
                            •
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {tx.vaultName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-medium ${getAmountColor(tx.type)}`}
                    >
                      {formatAmount(tx.amount, tx.type, tx)}
                      {tx.token}
                    </span>
                    {tx.type === "swap" && tx.swapDetails && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Got {tx.swapDetails.outputToken}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              No transactions found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;