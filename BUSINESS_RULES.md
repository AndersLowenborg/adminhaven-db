
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

### Round Flow
1. **Start Round (Play)**
   - Admin initiates round with Play button
   - Round status set to STARTED
   - Users can submit responses

2. **Lock Round**
   - Admin locks round with Lock button
   - Round status set to LOCKED
   - No more responses accepted
   - Enables "Prepare Groups" functionality

3. **Prepare Groups & Next Round**
   - Only available when round is LOCKED
   - Automatically creates next round
   - Updates SESSION.has_active_round
   - Re-enables Play button for next round

### Round Types and Progression

#### First Round (Individual)
- Every user answers individually
- No groups in this round
- Completes when admin locks it
- Admin can prepare groups after locking

#### Second Round (Initial Groups)
- Starts after First Round group preparation
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
- Each round must be locked before moving to next
- Admin can toggle result visibility at any time for any round
- Only group leaders can submit answers for their group
- Groups can only be prepared after round is locked
- Admin controls round progression through Lock and Prepare Groups actions

## Statement Management

### Statement Rules
- Statements can only be added/edited/deleted when session is UNPUBLISHED
- Statements can have optional background information
- At least one statement required to publish session

## Group Management

### Group Formation Rules
- Groups are formed automatically after first round is locked
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

