
import { useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from 'qrcode.react';
import { useParams, useNavigate } from 'react-router-dom';
import { ParticipantsList } from '@/components/session/ParticipantsList';
import { StatementResults } from '@/components/session/StatementResults';
import { useParticipants } from '@/hooks/use-participants';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';
import { useStatementVisibility } from '@/hooks/use-statement-visibility';

const PresenterPage = () => {
  const { id: sessionIdString } = useParams();
  const sessionId = sessionIdString ? parseInt(sessionIdString, 10) : null;
  const sessionUrl = sessionId ? `${window.location.origin}/user/${sessionId}` : '';
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { participants } = useParticipants(sessionId!);
  const { visibleResults } = useStatementVisibility(sessionId!);

  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ['presenter-session', sessionId],
    queryFn: async () => {
      console.log('Fetching session data for presenter page, ID:', sessionId);
      
      const { count, error: countError } = await supabase
        .from('SESSION')
        .select('*', { count: 'exact', head: true })
        .eq('id', sessionId);
        
      if (countError) {
        console.error('Error checking session existence:', countError);
        throw countError;
      }
      
      if (count === 0) {
        console.error('No session found with ID:', sessionId);
        throw new Error('Session not found');
      }

      const { data, error } = await supabase
        .from('SESSION')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching session:', error);
        throw error;
      }
      
      if (!data) {
        console.error('Session data is null despite count > 0. Possible RLS issue.');
        throw new Error('Session not found');
      }
      
      return data;
    },
    enabled: !!sessionId,
  });

  const { data: statements } = useQuery({
    queryKey: ['statements', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('STATEMENT')
        .select('*')
        .eq('session_id', sessionId);

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  const { data: rounds } = useQuery({
    queryKey: ['rounds', sessionId],
    queryFn: async () => {
      console.log('Fetching rounds for session:', sessionId);
      
      const { data: statements, error: statementsError } = await supabase
        .from('STATEMENT')
        .select('id')
        .eq('session_id', sessionId);

      if (statementsError) throw statementsError;
      
      if (!statements || statements.length === 0) {
        console.log('No statements found for session');
        return [];
      }

      const statementIds = statements.map(s => s.id);
      console.log('Statement IDs:', statementIds);

      const { data, error } = await supabase
        .from('ROUND')
        .select('*')
        .in('statement_id', statementIds);

      if (error) throw error;
      console.log('Fetched rounds:', data);
      return data;
    },
    enabled: !!sessionId,
  });

  const { data: answers } = useQuery({
    queryKey: ['presenter-answers', sessionId],
    queryFn: async () => {
      if (!rounds || rounds.length === 0) {
        console.log('No rounds found');
        return [];
      }

      const roundIds = rounds.map(round => round.id);
      console.log('Fetching answers for rounds:', roundIds);
      
      const { data, error } = await supabase
        .from('ANSWER')
        .select('*')
        .in('round_id', roundIds);

      if (error) throw error;
      console.log('Fetched answers:', data);
      return data || [];
    },
    enabled: !!sessionId && !!rounds,
  });

  const { data: groups } = useQuery({
    queryKey: ['presenter-groups', sessionId],
    queryFn: async () => {
      if (!sessionId) {
        console.log('No session ID available');
        return [];
      }

      console.log('Fetching groups for session:', sessionId);

      const { data: sessionData, error: sessionError } = await supabase
        .from('SESSION')
        .select('has_active_round')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      if (!sessionData?.has_active_round) {
        console.log('No active round found');
        return [];
      }

      const { data: roundGroups, error: roundGroupsError } = await supabase
        .from('ROUND_GROUPS')
        .select('groups_id')
        .eq('round_id', sessionData.has_active_round);

      if (roundGroupsError) throw roundGroupsError;
      
      const groupIds = roundGroups?.map(rg => rg.groups_id).filter(Boolean) || [];
      if (groupIds.length === 0) {
        console.log('No groups found for round');
        return [];
      }

      console.log('Found group IDs:', groupIds);

      // Fetch both groups and their answers in parallel
      const [groupsResult, answersResult] = await Promise.all([
        supabase
          .from('GROUPS')
          .select(`
            id,
            leader,
            GROUP_MEMBERS!inner (
              id,
              member_id,
              member_type
            )
          `)
          .in('id', groupIds),
        
        supabase
          .from('ANSWER')
          .select('*')
          .eq('round_id', sessionData.has_active_round)
          .eq('respondant_type', 'GROUP')
          .in('respondant_id', groupIds)
      ]);

      if (groupsResult.error) throw groupsResult.error;
      if (answersResult.error) throw answersResult.error;

      const groupsData = groupsResult.data || [];
      const answers = answersResult.data || [];
      
      // Create a map of group IDs to their answer status
      const groupAnswers = new Map(answers.map(answer => [answer.respondant_id, true]));

      if (!groupsData) return [];

      console.log('Fetched groups data:', groupsData);

      const memberIds = groupsData.flatMap(group => 
        group.GROUP_MEMBERS?.map(member => member.member_id)
      ).filter(Boolean);

      const { data: users, error: usersError } = await supabase
        .from('SESSION_USERS')
        .select('id, name')
        .in('id', memberIds);

      if (usersError) throw usersError;

      console.log('Fetched users data:', users);

      const userMap = new Map(users?.map(user => [user.id, user.name]));

      return groupsData.map(group => ({
        ...group,
        hasAnswered: groupAnswers.has(group.id),
        members: group.GROUP_MEMBERS.map(member => ({
          ...member,
          name: userMap.get(member.member_id) || 'Unknown User'
        }))
      }));
    },
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (!sessionId) return;

    const statementsChannel = supabase
      .channel(`presenter-statements-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'STATEMENT',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['statements', sessionId] });
        }
      )
      .subscribe();

    const roundsChannel = supabase
      .channel(`presenter-rounds-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ROUND'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['rounds', sessionId] });
        }
      )
      .subscribe();

    const answersChannel = supabase
      .channel(`presenter-answers-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ANSWER'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['presenter-answers', sessionId] });
        }
      )
      .subscribe();

    const groupsChannel = supabase
      .channel(`presenter-groups-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'GROUP'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['presenter-groups', sessionId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statementsChannel);
      supabase.removeChannel(roundsChannel);
      supabase.removeChannel(answersChannel);
      supabase.removeChannel(groupsChannel);
    };
  }, [sessionId, queryClient]);

  const getAnswersForStatement = (statement: any) => {
    if (!answers || !rounds) {
      console.log('No answers or rounds available');
      return [];
    }
    
    const statementRoundIds = rounds
      .filter(round => round.statement_id === statement.id)
      .map(round => round.id);
    
    console.log(`Statement ${statement.id} has rounds:`, statementRoundIds);
    
    const statementAnswers = answers.filter(answer => 
      statementRoundIds.includes(answer.round_id || 0)
    );
    
    console.log(`Statement ${statement.id} has ${statementAnswers.length} answers`);
    return statementAnswers;
  };

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="container mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Button>
          <p className="text-[#8E9196]">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session || !sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="container mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Button>
          <Card className="p-6">
            <p className="text-red-600">Session not found. This session might have been deleted or you may not have permission to access it.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-8">
        <div className="flex items-center gap-4 mb-8">
          <img 
            src="/lovable-uploads/8d75e7fa-b26c-4754-875c-9846105ff72b.png" 
            alt="Grousion Logo" 
            className="w-48 h-auto"
          />
          <h1 className="text-3xl font-bold text-[#403E43]">Presenter Dashboard</h1>
        </div>
        
        {session && (
          <Card className="mb-8 p-6 shadow-sm">
            <div className="space-y-6">
              <ParticipantsList 
                participants={participants || []} 
                sessionId={sessionId}
                queryKey={['participants', sessionId]}
              />
              
              {groups && groups.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-gray-600" />
                    <h2 className="text-xl font-semibold text-gray-800">Current Groups</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.map((group) => (
                      <Card key={group.id} className="p-4 bg-white/50 backdrop-blur-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`font-medium ${group.hasAnswered ? 'text-green-600' : 'text-gray-800'}`}>
                            Group {group.id}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {group.members.length} members
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {group.members.map((member) => (
                            <div 
                              key={member.member_id} 
                              className={`flex items-center justify-between p-2 rounded-lg ${
                                group.leader === member.member_id 
                                  ? 'bg-blue-50 border border-blue-100' 
                                  : 'bg-gray-50 border border-gray-100'
                              }`}
                            >
                              <span className="text-sm text-gray-700">{member.name}</span>
                              {group.leader === member.member_id && (
                                <Badge variant="secondary" className="text-xs">
                                  Leader
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
        
        {statements && statements.length > 0 ? (
          <div className="space-y-6 mb-8">
            {statements.map(statement => {
              const statementAnswers = getAnswersForStatement(statement);
              return (
                <StatementResults
                  key={statement.id}
                  statement={statement}
                  answers={statementAnswers}
                  isVisible={visibleResults.includes(statement.id)}
                />
              );
            })}
          </div>
        ) : (
          <Card className="mb-8 p-6 shadow-sm text-center">
            <p className="text-[#8E9196]">No statements to show.</p>
          </Card>
        )}
        
        <Card className="p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-[#403E43]">Session Information</h2>
          <div className="flex items-start gap-8">
            <div className="flex-1">
              <p className="mb-2 text-[#8E9196]">Share this link with participants:</p>
              <input
                type="text"
                value={sessionUrl}
                readOnly
                className="w-full p-2 border rounded bg-gray-50 text-[#403E43]"
                onClick={(e) => e.currentTarget.select()}
              />
            </div>
            <div className="flex-shrink-0">
              <QRCodeSVG value={sessionUrl} size={200} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PresenterPage;
