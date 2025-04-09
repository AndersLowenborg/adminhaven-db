
# Business Rules and Flow

Grousion is tool to help groups take a stand on different statements. An administrator
creates a session to which users can join remotely using a link or QR code. When the admin starts the first round every user sees the statement on their device with two sliders. One on how much they agree with that statment and the other how confident they are with their reply. When everyone has replied the admin locks that round and all users are divided into groups of approx three. The admin then starts round 2. One user in each group is randomly selected as leader and on the leaders device the group can answer the statement with the same sliders. Once all groups have answered the admin locks that round and the groups are merged into bigger groups and the nect round will start until there are only 2 or 3 groups left.

To make this work there are three main pages; Admin page, Presenter page, User page.
The Admin page is where the admin creates new sessions or opens existing ones. Adds statements and starts and stops rounds.
The Presenter pags is where we show info how to join the session (link & QR code), names of who has joined the session, current Statement, live results in a diagram, whos has answered, Group info (number, members).
The User page is where the user sees the Statements and the answer options.

So for each Session we have zero or more Statments and Users.
And every Statement has Rounds.
For each Round there are Answers from eiher Users or Groups.


A Session can be:
  Unpublished - What?     - Statements can be added
                Pre req.  - Admin has logged on.
                          - Session state was published or Session was just created.
                How?      - Admin creates new session or Admin presses the Session Stop Button.
                Enables   - Session Play Button
                          - Add Statement
                Disables  -

  Published - What?       - Open for users to join
              Pre req.    - Session has at least one Statement.
              How?        - Admin presses Session Play button OR the Sessopn Lock Button 
              Enables     - Session Lock Button
                          - Session Stop Button
                          - Session Show Presenter View button
              Disables    - Session Play Button
  

  Locked -    What?       - No more users can join.
              Pre req.    - Session state was Published
              How?        - Admin presses the Lock button
              Enables     - Statment Play button
                          - Session Unlock button
        
  Ended -     What?       - We close the Session and all its Statements/Rounds.
              Pre req.    -
              How?        - Admin presses the Session End button
              Enables     - Session Data Analysis button
              Disables    - All Session and Statement buttons
                    

A Round can be:
    Not_Started -   What?     - Default/Intial state
                    Pre req.  - Statement has been created
                              - Previous round has status Complteted
                    How?      - 
                    Enables   - Round Play Button
                    Disables  -
    
    Started -   What?     - Round starts and Users are shown the statements
                Pre req.  - Session has status Locked
                          - Round has status Not_Started
                How?      - Admin presses the Round Play button
                Enables   - Show Results button
                          - Round Locked button
                Disables  - Round Play button
    
    Locked -   What?      - No more answers allowed.
                Pre req.  - Session has status Locked
                          - Round has status Started
                How?      - Admin presses the Round Lock button
                Enables   - Round Prepare Groups button OR Round end Button 
                          - Round Play button
                Disables  - Round Locked button

    Completed - What?     - Round is completed for statement.
                Pre req.  - Session has status Locked
                          - Round has status Locked
                How?      - Admin presses Round Prepare Groups button or Round End button 
                Enables   - Round Play button IF there is a next Round
                Disables  - Round Round Prepare Groups button




Buttons on Admin Page:

    Session Play/Stop Button
      -Can have two states - Play or Stop
      -Shows Play or Stop symbol. 
      -Is used to Publish/Unpublish a session
      -Is enabled when there is at least one Statment.
      -Is disabled if Statements are removed and there are no Statements left
      

    Session Lock Button
      -is enabled when Session is Published
      -is used to Lock a Session
      -Shows Open or Closed Lock symbol. 
      -when Session state is Published it shows the Open Lock Symbol
      -when Session state is Locked it shows the Closed Lock Symbol

    Session Open Presenter Page Button
      -Opens the Presenter Page in a new window
      -Is enabled when a Session is Published
      -Is disabled when a Session is Unpublished

    Statement Play Button
      -Is used to Start or Lock a Round
      -Shows Play or Open Lock or Closed Lock symbol.
      -is enabled when Session is Locked
      -Default is Play symbol then changes into Open Lock Symbol when Round is Started the changes into Closed Lock symbol when Round state is Locked.
      -if Play symbol and clicked - Round state = STARTED and symbol set to Open Lock
      -if Open Lock symbol and Clicked - Round state = Locked and symbol set top Closed Lock
      -if Closed Lock symbol and Clicked - Round state = STARTED and symbol set to Open Lock

    Statement Prepare Group Button
      -is used to Prepare the next round and create Groups (if there are more rounds)
      -is enabled when Round State is Locked.
      -sets Round state = Completed and disables Statement Play button.

    Statemet Show Results button
      -is used to toggle if answer diagram on presenter page should be shown or not.
      -is always enabled.

    Statemet Edit button
      -is used to edit the Statement.
      -is disabled first time Round state is set to STARTED. Never enabled again. 

     Statemet Delete button
      -is used to delete the Statement.
      -is always enabled

Rounds
First Round (Individual)
- Every user answers individually
- No groups in this round
- Completes when admin locks it
- Admin can prepare groups after locking

Second Round (Initial Groups)
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

Third Round (Merged Groups)
- Starts after Second Round completion
- Requires more than 2 groups from second round
- Group Merging Rules:
  - 2-3 groups → 1 group
  - 4-6 groups → 2 groups
  - And so on

Fourth Round (Final Merge)
- Starts after Third Round completion
- Requires more than 2 groups from third round
- Uses same merging rules as Third Round
- This is the final round (maximum 4 rounds)

