
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Cell } from 'recharts';
import { ChartTooltip } from "@/components/ui/chart";

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
  '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71',
  '#F1C40F', '#E74C3C', '#1ABC9C', '#34495E', '#95A5A6'
];

type Answer = {
  id: number;
  agreement_level: number | null;
  confidence_level: number | null;
  comment: string | null;
  created_at: string | null;
  respondant_id: number | null;
  respondant_type: 'SESSION_USER' | 'GROUP' | null;
  round_id: number | null;
};

interface StatementResultsProps {
  statement: {
    id: number;
    statement: string | null;
  };
  answers: Answer[];
  isVisible: boolean;
}

export const StatementResults = ({ statement, answers, isVisible }: StatementResultsProps) => {
  const chartData = answers.map((answer, index) => ({
    x: answer.agreement_level,
    y: answer.confidence_level,
    agreement: answer.agreement_level,
    confidence: answer.confidence_level,
    colorIndex: index % COLORS.length
  }));

  return (
    <Card key={statement.id} className="p-6 shadow-sm">
      <h3 className="text-xl font-medium mb-4 text-[#403E43]">{statement.statement}</h3>
      {chartData.length > 0 ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Agreement" 
                domain={[0, 10]}
                tickCount={11}
                label={{ value: 'Agreement Level', position: 'bottom', style: { fill: '#8E9196' } }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Confidence"
                domain={[0, 10]}
                tickCount={11}
                label={{ value: 'Confidence Level', angle: -90, position: 'insideLeft', style: { fill: '#8E9196' } }}
              />
              <Scatter data={chartData}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.colorIndex]}
                  />
                ))}
              </Scatter>
              <ChartTooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 border rounded shadow">
                        <p>Agreement: {data.agreement}</p>
                        <p>Confidence: {data.confidence}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 w-full flex items-center justify-center text-[#8E9196]">
          No answers yet
        </div>
      )}
      <div className="mt-4 text-sm text-[#8E9196]">
        Total responses: {answers.length}
      </div>
    </Card>
  );
};

