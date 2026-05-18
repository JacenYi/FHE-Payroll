import { Wallet, CheckCircle, AlertCircle } from 'lucide-react';

export default function WalletSection({ account, onConnect, isConnecting }) {
  return (
    <div className="border-glow rounded-xl p-6 bg-surface/50 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/20">
          <Wallet className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-text-primary">Wallet</h2>
      </div>

      {!account ? (
        <button
          onClick={onConnect}
          disabled={isConnecting}
          className="w-full py-3 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition-all duration-200 glow-purple disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Connecting...
            </span>
          ) : (
            'Connect Wallet'
          )}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Connected</span>
          </div>
          <div className="p-3 rounded-lg bg-card border border-border">
            <p className="text-xs text-text-muted mb-1">Address</p>
            <p className="font-mono text-sm text-accent break-all">
              {account.slice(0, 8)}...{account.slice(-6)}
            </p>
          </div>
        </div>
      )}

      {!account && (
        <div className="mt-4 p-3 rounded-lg bg-card/50 border border-border/50">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-highlight mt-0.5 flex-shrink-0" />
            <p className="text-xs text-text-muted">
              Please install MetaMask to connect your wallet
            </p>
          </div>
        </div>
      )}
    </div>
  );
}