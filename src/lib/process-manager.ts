/**
 * Process manager to limit concurrent background processes and manage resources
 */
class ProcessManager {
  private runningProcesses = new Set<string>();
  private maxConcurrentProcesses = 2; // Limit to 2 concurrent analyses

  /**
   * Check if a process can start
   */
  canStartProcess(processId: string): boolean {
    return !this.runningProcesses.has(processId) &&
           this.runningProcesses.size < this.maxConcurrentProcesses;
  }

  /**
   * Start a process
   */
  startProcess(processId: string): boolean {
    if (!this.canStartProcess(processId)) {
      return false;
    }
    this.runningProcesses.add(processId);
    console.log(`🔄 Started process: ${processId} (${this.runningProcesses.size}/${this.maxConcurrentProcesses})`);
    return true;
  }

  /**
   * End a process
   */
  endProcess(processId: string): void {
    if (this.runningProcesses.has(processId)) {
      this.runningProcesses.delete(processId);
      console.log(`✅ Ended process: ${processId} (${this.runningProcesses.size}/${this.maxConcurrentProcesses})`);
    }
  }

  /**
   * Check if process is running
   */
  isProcessRunning(processId: string): boolean {
    return this.runningProcesses.has(processId);
  }

  /**
   * Get current process count
   */
  getProcessCount(): number {
    return this.runningProcesses.size;
  }

  /**
   * Get running processes
   */
  getRunningProcesses(): string[] {
    return Array.from(this.runningProcesses);
  }

  /**
   * Force clear all processes (for debugging/emergency cleanup)
   */
  clearAllProcesses(): void {
    const count = this.runningProcesses.size;
    this.runningProcesses.clear();
    console.log(`🧹 Force cleared ${count} stuck processes`);
  }

  /**
   * Get detailed status for debugging
   */
  getStatus(): { count: number, maxConcurrent: number, processes: string[] } {
    return {
      count: this.runningProcesses.size,
      maxConcurrent: this.maxConcurrentProcesses,
      processes: Array.from(this.runningProcesses)
    };
  }
}

// Global singleton instance
export const processManager = new ProcessManager();