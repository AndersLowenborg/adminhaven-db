
# Business Rules and Flow

## Session Lifecycle

### Session States
1. **Unpublished** (Initial State)
   - Session starts in this state
   - Admin can add/edit/delete statements
   - Admin can't start rounds

2. **Published**
   - Requires at least one statement
   - Users can join the session
   - Admin can't modify statements
   - Can't start rounds yet (needs 2+ participants)

3. **Started**
   - Requires:
     - Session must be Published
     - At least 2 participants
   - New users cannot join once started
   - Rounds can begin

### Session Rules
- Only unpublished sessions can have statements added/edited/deleted
- Session needs minimum 2 participants to start
- Session automatically closes to new joins when started

## Round Management

### Round Types and Progression

#### First Round (Individual)
- Every user answers individually
- No groups in this round
- Completes when:
  - All participants have answered, OR
  - Admin manually completes it
- Admin can pause/stop round at any time

#### Second Round (Initial Groups)
- Starts after First Round completion
- Requires more than 2 users from first round
- Group Formation Rules:
  - 2-3 users → 1 group
  - 4-6 users → 2 groups
  - And so on
- Grouping Criteria:
  - Users with medium confidence levels are grouped together randomly
  - Users with high confidence levels and opposing agreement levels are grouped together randomly
- Each group gets a randomly assigned leader

#### Third Round (Merged Groups)
- Starts after Second Round completion
- Requires more than 2 groups from second round
- Group Merging Rules:
  - 2-3 groups → 1 group
  - 4-6 groups → 2 groups
  - And so on

#### Fourth Round (Final Merge)
- Starts after Third Round completion
- Requires more than 2 groups from third round
- Uses same merging rules as Third Round
- This is the final round (maximum 4 rounds)

### Round Rules
- Each round must complete before next can start
- Admin can toggle result visibility at any time for any round
- Only group leaders can submit answers for their group
- Admin can manually complete any round
- Admin can pause/stop rounds at any time

## Statement Management

### Statement Rules
- Statements can only be added/edited/deleted when session is UNPUBLISHED
- Statements can have optional background information
- At least one statement required to publish session

## Group Management

### Group Formation Rules
- Groups are formed automatically after first round
- Group size is determined by total participant count
- Each group must have a leader
- Only group leaders can submit answers
- Grouping priorities:
  1. Medium confidence users together
  2. High confidence users with opposing views together
  3. Random assignment for remaining cases

### Group Merging Rules
- Merging occurs in third and fourth rounds
- Merge size determined by total group count
- New leader assigned randomly after merging
