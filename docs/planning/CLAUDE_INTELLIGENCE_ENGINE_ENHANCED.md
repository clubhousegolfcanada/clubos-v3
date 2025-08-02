# Claude Intelligence Engine - Enhanced Implementation

## Updated Approval Flow with SHA Validation

### 1. SOP Integrity Check
```typescript
// services/sopIntegrity.ts
import crypto from 'crypto';

export class SOPIntegrityService {
  // Generate hash of current SOP content
  async generateHash(sopId: number): Promise<string> {
    const result = await db.query(
      'SELECT content FROM sops WHERE id = $1',
      [sopId]
    );
    
    return crypto
      .createHash('sha256')
      .update(result.rows[0].content)
      .digest('hex');
  }
  
  // Validate before applying patch
  async validateBeforePatch(sopId: number, expectedHash: string): Promise<boolean> {
    const currentHash = await this.generateHash(sopId);
    
    if (currentHash !== expectedHash) {
      // SOP changed since suggestion was made
      await this.logConflict(sopId, expectedHash, currentHash);
      return false;
    }
    
    return true;
  }
}
```

### 2. Enhanced Approval Mechanism
```typescript
// UI Component for structured approvals
interface ApprovalModalProps {
  suggestion: ImprovementSuggestion;
  onApprove: (approval: ApprovalData) => void;
  onReject: (reason: string) => void;
}

export function ApprovalModal({ suggestion, onApprove, onReject }: ApprovalModalProps) {
  const [showDiff, setShowDiff] = useState(true);
  const [approvalNotes, setApprovalNotes] = useState('');
  
  return (
    <div className="modal">
      <h3>SOP Update Approval</h3>
      
      {/* Ticket Context */}
      <div className="context-box">
        <p>Original Query: {suggestion.originalQuery}</p>
        <p>Failed Response: {suggestion.failedResponse}</p>
        <p>Ticket ID: #{suggestion.ticketId}</p>
      </div>
      
      {/* SOP Change */}
      <div className="diff-viewer">
        <h4>Proposed Change to {suggestion.sopSection}</h4>
        <DiffViewer
          oldContent={suggestion.currentContent}
          newContent={suggestion.proposedContent}
        />
      </div>
      
      {/* Approval Actions */}
      <div className="actions">
        <textarea
          placeholder="Approval notes (optional)"
          value={approvalNotes}
          onChange={(e) => setApprovalNotes(e.target.value)}
        />
        
        <button onClick={() => onApprove({
          suggestionId: suggestion.id,
          approvedBy: currentUser.id,
          approvalNotes,
          sopHash: suggestion.sopHash,
          timestamp: new Date()
        })}>
          ✅ Approve & Apply
        </button>
        
        <button onClick={() => {
          const reason = prompt('Rejection reason:');
          if (reason) onReject(reason);
        }}>
          ❌ Reject
        </button>
      </div>
    </div>
  );
}
```

### 3. Semantic Grouping of Failures
```typescript
// services/semanticGrouping.ts
export class SemanticGroupingService {
  async groupFailedQueries(): Promise<GroupedFailures[]> {
    // Get unprocessed failures
    const failures = await db.query(`
      SELECT * FROM failed_responses 
      WHERE analyzed = false
      ORDER BY created_at DESC
      LIMIT 100
    `);
    
    // Use embeddings for semantic similarity
    const embeddings = await this.generateEmbeddings(failures.rows);
    
    // Cluster similar queries
    const clusters = await this.clusterBySimularity(embeddings, 0.85);
    
    // Create grouped suggestions
    return clusters.map(cluster => ({
      id: generateId(),
      queries: cluster.queries,
      commonPattern: this.extractPattern(cluster),
      suggestedFix: this.generateUnifiedFix(cluster),
      affectedCount: cluster.queries.length,
      examples: cluster.queries.slice(0, 3)
    }));
  }
  
  private async generateEmbeddings(queries: FailedResponse[]): Promise<number[][]> {
    // Use OpenAI embeddings API
    const embeddings = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: queries.map(q => q.query)
    });
    
    return embeddings.data.map(e => e.embedding);
  }
  
  private clusterBySimularity(embeddings: number[][], threshold: number) {
    // DBSCAN or similar clustering algorithm
    // Groups queries with cosine similarity > threshold
  }
}
```

### 4. Enhanced Change History
```sql
-- Updated schema for better tracking
ALTER TABLE sop_versions ADD COLUMN ticket_ids INTEGER[];
ALTER TABLE sop_versions ADD COLUMN approval_data JSONB;
ALTER TABLE sop_versions ADD COLUMN sha_before VARCHAR(64);
ALTER TABLE sop_versions ADD COLUMN sha_after VARCHAR(64);

-- Example approval data JSON
{
  "approvedBy": "user123",
  "approvalNotes": "Clarified PIN reset procedure",
  "approvalTimestamp": "2024-07-30T10:00:00Z",
  "ticketIds": [456, 457, 458],
  "semanticGroup": "pin_reset_issues",
  "affectedQueries": 3
}
```

### 5. CLI Approval Option (for automation)
```bash
#!/bin/bash
# claude-approve.sh

# List pending approvals
claude-cli approvals list

# Review specific suggestion
claude-cli approvals show 123

# Approve with notes
claude-cli approvals approve 123 \
  --notes "Fixed PIN reset instructions" \
  --verify-sha

# Bulk approve semantic group
claude-cli approvals approve-group pin_resets \
  --max 5 \
  --dry-run
```

## Updated Workflow

```
1. Failed Queries Batch (hourly)
        ↓
2. Semantic Grouping (reduce duplicates)
        ↓
3. Claude Analyzes Groups
        ↓
4. Generate Unified Fixes
        ↓
5. Calculate SHA of current SOP
        ↓
6. Create Improvement Suggestion
        ↓
7. Human Reviews (UI or CLI)
        ↓
8. Validate SHA (no conflicts)
        ↓
9. Apply Patch
        ↓
10. Log with full context
```

## Benefits of Enhancements

1. **Semantic Grouping**: Instead of 10 similar PIN issues → 1 grouped fix
2. **SHA Validation**: Prevents conflicts when multiple people editing
3. **Rich Approval Data**: Know exactly who approved what and why
4. **Flexible Interface**: UI for business users, CLI for developers
5. **Batch Processing**: Approve similar fixes together

This maintains our simple approval flow while adding GPT-4o's suggested safeguards!