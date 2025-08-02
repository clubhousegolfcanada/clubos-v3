# ClubOS V2 Safe Execution Framework

## Complete Redesign: Phased Execution with Safety Gates

### Core Principle: No Autonomous Destruction
Every Claude action must be:
1. Reversible
2. Auditable
3. Gated by checkpoints
4. Run in isolation first

## New Execution Architecture

### 1. Dry-Run Mode First
```bash
#!/bin/bash
# run_clubos_plan_safe.sh

# ALWAYS dry-run by default
DRY_RUN=${DRY_RUN:-true}
PHASE=${1:-1}
AUTO_APPROVE=${AUTO_APPROVE:-false}

echo "🛡️ ClubOS V2 Safe Execution Framework"
echo "Mode: ${DRY_RUN:+DRY RUN}${DRY_RUN:-LIVE}"
echo "Phase: $PHASE"
echo "=================================="

if [ "$DRY_RUN" = true ]; then
  echo "📝 DRY RUN MODE - No files will be created"
  echo "Actions will be logged to: ./dry-run-log.json"
fi
```

### 2. Phased Execution Plan
```typescript
// execution/phases.ts
export const EXECUTION_PHASES = {
  1: {
    name: "Infrastructure Setup",
    description: "Create directories and base config",
    requiredApproval: false,
    rollbackable: true,
    actions: [
      "Create directory structure",
      "Initialize git repository", 
      "Create .env templates"
    ]
  },
  2: {
    name: "Database Schema",
    description: "Create PostgreSQL schema and migrations",
    requiredApproval: true,
    rollbackable: true,
    actions: [
      "Generate migration files",
      "Create rollback scripts",
      "Validate schema"
    ]
  },
  3: {
    name: "Core Services",
    description: "Generate routing engine and services",
    requiredApproval: true,
    rollbackable: true,
    actions: [
      "Create TypeScript services",
      "Generate API routes",
      "Build authentication"
    ]
  },
  4: {
    name: "AI Integration",
    description: "Connect OpenAI and Claude services",
    requiredApproval: true,
    rollbackable: true,
    actions: [
      "Create assistant configs",
      "Set up knowledge router",
      "Configure Claude engine"
    ]
  },
  5: {
    name: "UI Components",
    description: "Generate frontend components",
    requiredApproval: true,
    rollbackable: true,
    actions: [
      "Create React components",
      "Generate admin panels",
      "Build approval interfaces"
    ]
  }
};
```

### 3. Claude Execution Wrapper
```typescript
// execution/claudeWrapper.ts
export class SafeClaudeExecutor {
  private changes: FileChange[] = [];
  private backups: Map<string, string> = new Map();
  
  async executePhase(phase: number, dryRun: boolean = true) {
    const phaseConfig = EXECUTION_PHASES[phase];
    
    // Create branch for this phase
    const branchName = `autogen/phase-${phase}-${Date.now()}`;
    await git.checkout('-b', branchName);
    
    try {
      // Execute with rollback protection
      await this.withRollback(async () => {
        for (const action of phaseConfig.actions) {
          await this.executeAction(action, dryRun);
        }
      });
      
      // Generate diff report
      const diffReport = await this.generateDiffReport();
      
      if (dryRun) {
        console.log("🔍 DRY RUN COMPLETE - Review changes:");
        console.log(diffReport);
        return { success: true, changes: this.changes, diff: diffReport };
      }
      
      // Real execution requires approval
      if (phaseConfig.requiredApproval && !AUTO_APPROVE) {
        const approved = await this.requestApproval(diffReport);
        if (!approved) {
          throw new Error("Phase rejected by user");
        }
      }
      
      // Commit changes
      await git.add('.');
      await git.commit(`Phase ${phase}: ${phaseConfig.name}`);
      
      return { success: true, branch: branchName };
      
    } catch (error) {
      // Rollback on any error
      await this.rollback();
      throw error;
    }
  }
  
  private async executeAction(action: string, dryRun: boolean) {
    const timestamp = new Date().toISOString();
    
    // Log every action
    const logEntry = {
      timestamp,
      action,
      phase: this.currentPhase,
      dryRun,
      status: 'pending'
    };
    
    try {
      // Backup before any write
      if (!dryRun && action.includes('Create') || action.includes('Generate')) {
        await this.backupExistingFiles();
      }
      
      // Execute through Claude
      const result = await this.claudeExecute(action, dryRun);
      
      logEntry.status = 'success';
      logEntry.result = result;
      
      // Track changes
      this.changes.push(...result.changes);
      
    } catch (error) {
      logEntry.status = 'failed';
      logEntry.error = error.message;
      throw error;
    } finally {
      await this.logAction(logEntry);
    }
  }
  
  private async backupExistingFiles() {
    const files = await this.findExistingFiles();
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      
      // Store backup with hash
      this.backups.set(file, content);
      
      // Also create .backup file
      await fs.writeFile(`${file}.backup-${Date.now()}`, content);
    }
  }
  
  private async rollback() {
    console.log("🔄 Rolling back changes...");
    
    // Restore all backups
    for (const [file, content] of this.backups) {
      await fs.writeFile(file, content);
    }
    
    // Git reset
    await git.reset('--hard', 'HEAD');
    
    console.log("✅ Rollback complete");
  }
}
```

### 4. Checkpoint Gates
```typescript
// execution/checkpoints.ts
export class CheckpointManager {
  async validatePhase(phase: number): Promise<ValidationResult> {
    const checks = {
      1: this.validateInfrastructure,
      2: this.validateDatabase,
      3: this.validateServices,
      4: this.validateAI,
      5: this.validateUI
    };
    
    const validator = checks[phase];
    if (!validator) throw new Error(`No validator for phase ${phase}`);
    
    return await validator.call(this);
  }
  
  private async validateDatabase(): Promise<ValidationResult> {
    const checks = [
      { name: 'Schema exists', fn: this.checkSchemaExists },
      { name: 'Migrations valid', fn: this.checkMigrationsValid },
      { name: 'Rollback scripts exist', fn: this.checkRollbackScripts },
      { name: 'Test data loads', fn: this.checkTestData }
    ];
    
    const results = await Promise.all(
      checks.map(async (check) => ({
        ...check,
        passed: await check.fn()
      }))
    );
    
    return {
      phase: 2,
      passed: results.every(r => r.passed),
      details: results
    };
  }
}
```

### 5. Execution UI
```tsx
// components/ExecutionDashboard.tsx
export function ExecutionDashboard() {
  const [currentPhase, setCurrentPhase] = useState(1);
  const [dryRunResults, setDryRunResults] = useState(null);
  const [executing, setExecuting] = useState(false);
  
  const runPhase = async (phase: number, dryRun: boolean) => {
    setExecuting(true);
    
    try {
      const executor = new SafeClaudeExecutor();
      const result = await executor.executePhase(phase, dryRun);
      
      if (dryRun) {
        setDryRunResults(result);
      } else {
        toast.success(`Phase ${phase} completed!`);
        setCurrentPhase(phase + 1);
      }
    } catch (error) {
      toast.error(`Phase ${phase} failed: ${error.message}`);
    } finally {
      setExecuting(false);
    }
  };
  
  return (
    <div className="execution-dashboard">
      <h2>ClubOS V2 Execution Control</h2>
      
      {/* Phase Progress */}
      <div className="phases">
        {Object.entries(EXECUTION_PHASES).map(([num, phase]) => (
          <div 
            key={num} 
            className={`phase ${num <= currentPhase ? 'completed' : ''}`}
          >
            <h3>Phase {num}: {phase.name}</h3>
            <p>{phase.description}</p>
            
            {num === currentPhase && (
              <div className="actions">
                <button onClick={() => runPhase(num, true)}>
                  🔍 Dry Run
                </button>
                
                {dryRunResults && (
                  <button onClick={() => runPhase(num, false)}>
                    ✅ Execute
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Dry Run Results */}
      {dryRunResults && (
        <div className="dry-run-results">
          <h3>Dry Run Results</h3>
          <DiffViewer changes={dryRunResults.changes} />
          
          <div className="stats">
            <p>Files to create: {dryRunResults.changes.filter(c => c.type === 'create').length}</p>
            <p>Files to modify: {dryRunResults.changes.filter(c => c.type === 'modify').length}</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 6. New Safe Execution Flow
```
1. Always start with dry-run
2. Review proposed changes
3. Execute phase with backups
4. Validate phase completed correctly
5. Manual approval before next phase
6. Each phase in separate git branch
7. Merge to main only after full validation
```

## Benefits of Safe Approach

1. **No Surprises** - See everything before it happens
2. **Full Rollback** - Every change reversible
3. **Phase Isolation** - Problems don't cascade
4. **Git History** - Every change tracked
5. **Manual Gates** - Human controls pace
6. **Validation** - Each phase verified before continuing

This transforms the scary "autonomous Claude" into a supervised assistant that shows its work!