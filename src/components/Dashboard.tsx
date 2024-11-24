import { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { Card } from './ui/card';
import { Modal } from './ui/modal';
import { ArrowUpRight } from 'lucide-react';

// Define SupportingDataItem interface
interface SupportingDataItem {
  Metric: string;
  Value: number;
  Change: number;
  Date: string;
}

// Updated MarketTrend interface
interface MarketTrend {
  Trend: string;
  Analysis: string;
  Impact: string;
  Direction: string;
  Confidence: string;
  Supporting_Data: SupportingDataItem[];
}

// Define other interfaces
interface Fund {
  Fund_Name: string;
  Scheme_Code: string;
  Fund_House: string;
  Scheme_Type: string;
  Scheme_Category: string;
  Performance_Rating: string;
  Risk_Rating: string;
  Currency: string;
  Exchange: string;
  MIC_Code: string;
  Latest_NAV: number;
  Historical_Returns: {
    Time_Period: string;
    Return_Percentage: number;
  }[];
  Expense_Ratio: number;
  AUM?: number;
}

interface Strategy {
  Strategy: string;
  Description: string;
  Benefits: string;
  Recommended_Allocation: string;
  Supported_Funds: {
    Scheme_Code: string;
    Fund_Name: string;
    Allocation_Percentage: number;
    Key_Metrics: {
      '1Y_Return': number;
      '3Y_Return': number;
      '5Y_Return': number;
      Standard_Deviation: number;
      Sharpe_Ratio: number;
    };
  }[];
}

interface GrowthProjection {
  Year: number;
  Projected_Value: number;
  Best_Case: number;
  Worst_Case: number;
  Expected_Return: number;
  CAGR?: number;
}

interface InvestmentPlan {
  Initial_Investment: number;
  Allocation: {
    Fund_Name: string;
    Scheme_Code: string;
    Investment_Amount: number;
    Percentage: number;
    Projected_Returns: number;
    Investment_Strategy: string;
  }[];
  Growth_Projection: GrowthProjection[];
}

interface RiskAssessment {
  Risk: string;
  Category: string;
  Severity: string;
  Probability: string;
  Impact_Score: number;
  Assessment: string;
  Mitigation_Strategies: string;
  Associated_Funds: {
    Scheme_Code: string;
    Fund_Name: string;
  }[];
}

interface Justification {
  Title: string;
  Details: string;
  Associated_Funds: {
    Scheme_Code: string;
    Fund_Name: string;
  }[];
}

interface ProjectedOutcome {
  Time_Horizon: string;
  Projected_Return: number;
  Details: string;
  Assumptions: string;
  Risk_Adjusted_Return: number;
}

interface InvestmentAction {
  Action: string;
  Details: string;
  Priority: string;
  Timeline: string;
  Expected_Impact: string;
  Associated_Strategies: string[];
}

interface Data {
  Investment_Actions: InvestmentAction[];
  Top_Mutual_Funds: Fund[];
  Diversification_Strategies: Strategy[];
  Sample_Investment_Plan: InvestmentPlan;
  Risk_Assessment: RiskAssessment[];
  Projected_Outcomes: ProjectedOutcome[];
  Justifications: Justification[];
  Market_Trends?: MarketTrend[];
}

export function Dashboard({ data }: { data: Data }) {
  const [selectedFund, setSelectedFund] = useState<number | null>(null);
  const [modalContent, setModalContent] = useState<string | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<any>(null);
  const [selectedMarketTrend, setSelectedMarketTrend] =
    useState<MarketTrend | null>(null);

  // Colors for charts
  const COLORS = ['#FFD700', '#FF6347', '#32CD32', '#1E90FF', '#FF69B4'];

  // Process data for pie chart
  const allocationPieData = data.Sample_Investment_Plan.Allocation.map(
    (item: any) => ({
      name: item.Fund_Name.split(' ').slice(0, 2).join(' '),
      value: item.Percentage,
      investmentAmount: item.Investment_Amount,
      projectedReturn: item.Projected_Returns,
    })
  );

  // Process data for growth projection chart
  const growthData = data.Sample_Investment_Plan.Growth_Projection.map(
    (item: any) => ({
      year: `Year ${item.Year}`,
      projected: item.Projected_Value,
      bestCase: item.Best_Case,
      worstCase: item.Worst_Case,
    })
  );

  // Process data for risk assessment bar chart
  const riskData = data.Risk_Assessment.map((risk: any) => ({
    risk: risk.Risk,
    Impact_Score: risk.Impact_Score,
    Severity: risk.Severity,
    details: risk.Assessment,
    associatedFunds: risk.Associated_Funds,
  }));

  // Handlers for modals
  const openModal = (content: string) => {
    setModalContent(content);
  };

  const closeModal = () => {
    setModalContent(null);
    setSelectedRisk(null);
    setSelectedMarketTrend(null);
  };

  const handleRiskClick = (data: any) => {
    setSelectedRisk(data);
  };

  const handleMarketTrendClick = (trend: MarketTrend) => {
    setSelectedMarketTrend(trend);
  };

  return (
    <div className="container mx-auto p-4 space-y-10 text-white">
      {/* Top Funds as per your need */}
      <div>
        <h2 className="text-3xl font-bold mb-6 text-gold-400">
          Top Funds as per your need
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
          {data.Top_Mutual_Funds.map((fund: any, index: number) => (
            <Card
              key={index}
              className="p-6 bg-black/40 backdrop-blur-sm border-gold-400/30 h-full cursor-pointer"
              onClick={() => setSelectedFund(index)}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-gold-400 text-lg">
                  {fund.Fund_Name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-gold-400 text-sm">
                    ₹{fund.Latest_NAV}
                  </span>
                  <ArrowUpRight
                    className="h-4 w-4 text-green-400"
                    strokeWidth={2.5}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 p-3 rounded-lg">
                  <p className="text-light-grey text-sm">Performance</p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-4 rounded-full ${
                          i < parseInt(fund.Performance_Rating)
                            ? 'bg-gold-400'
                            : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="bg-black/20 p-3 rounded-lg">
                  <p className="text-light-grey text-sm">Risk Level</p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-4 rounded-full ${
                          i < parseInt(fund.Risk_Rating)
                            ? 'bg-gold-400'
                            : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Market Trends */}
      {data.Market_Trends && data.Market_Trends.length > 0 && (
        <div>
          <h2 className="text-3xl font-bold mb-6 text-gold-400">
            Market Trends
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {data.Market_Trends.map((trend: MarketTrend, index: number) => (
              <Card
                key={index}
                className="p-6 bg-black/50 rounded-lg border border-gold-400/20 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarketTrendClick(trend);
                }}
              >
                <h3 className="font-semibold text-gold-400 mb-2">
                  {trend.Trend}
                </h3>
                <p className="text-white mb-2">{trend.Analysis}</p>
                <p className="text-white text-sm">
                  <strong>Impact:</strong> {trend.Impact}
                  <br />
                  <strong>Confidence:</strong> {trend.Confidence}%
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Investment Actions */}
      <div>
        <h2 className="text-3xl font-bold mb-6 text-gold-400">
          Investment Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {data.Investment_Actions.map((action: any, index: number) => (
            <Card
              key={index}
              className="p-6 bg-black/50 rounded-lg border border-gold-400/20"
            >
              <h3 className="font-semibold text-gold-400 mb-2">
                {action.Action}
              </h3>
              <p className="text-white mb-2">{action.Details}</p>
              <p className="text-white text-sm">
                <strong>Priority:</strong> {action.Priority}
                <br />
                <strong>Timeline:</strong> {action.Timeline}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Investment Justifications */}
      <div>
        <h2
          className="text-3xl font-bold mb-6 text-gold-400 cursor-pointer"
          onClick={() => openModal('Investment Justifications')}
        >
          Investment Justifications
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {data.Justifications.map((justification: any, index: number) => (
            <Card
              key={index}
              className="p-6 bg-black/50 rounded-lg border border-gold-400/20 cursor-pointer"
              onClick={() => openModal('Investment Justifications')}
            >
              <h3 className="font-semibold text-gold-400 mb-2">
                {justification.Title}
              </h3>
              <p className="text-white mb-2">{justification.Details}</p>
              <p className="text-white text-sm">
                <strong>Associated Funds:</strong>{' '}
                {justification.Associated_Funds.map(
                  (fund: any) => fund.Fund_Name
                ).join(', ')}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Risk Assessment Based on your need */}
      <div>
        <h2 className="text-3xl font-bold mb-6 text-gold-400">
          Risk Assessment Based on your need
        </h2>
        <Card className="p-6 bg-black/50 rounded-lg mb-12">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={riskData}
                layout="vertical"
                onClick={(data) => {
                  if (
                    data &&
                    data.activePayload &&
                    data.activePayload.length > 0
                  ) {
                    handleRiskClick(data.activePayload[0].payload);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis type="number" stroke="#FFD700" />
                <YAxis
                  dataKey="risk"
                  type="category"
                  stroke="#FFD700"
                  width={150}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend />
                <Bar
                  dataKey="Impact_Score"
                  fill="#FF6347"
                  name="Impact Score"
                />
                <Bar dataKey="Severity" fill="#32CD32" name="Severity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Diversification Strategies */}
      <div>
        <h2 className="text-3xl font-bold mb-6 text-gold-400">
          Diversification Strategies
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {data.Diversification_Strategies.map(
            (strategy: any, index: number) => (
              <Card
                key={index}
                className="p-6 bg-black/50 rounded-lg border border-gold-400/20"
              >
                <h3 className="font-semibold text-gold-400 mb-2">
                  {strategy.Strategy}
                </h3>
                <p className="text-white mb-2">{strategy.Description}</p>
                <p className="text-white text-sm">
                  <strong>Benefits:</strong> {strategy.Benefits}
                  <br />
                  <strong>Recommended Allocation:</strong>{' '}
                  {strategy.Recommended_Allocation}
                </p>
                <div className="h-[200px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={strategy.Supported_Funds}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                      <XAxis
                        dataKey="Fund_Name"
                        stroke="#FFD700"
                        label={{
                          value: 'Funds',
                          position: 'insideBottom',
                          offset: -5,
                        }}
                      />
                      <YAxis stroke="#FFD700" />
                      <Tooltip content={<CustomTooltipGeneral />} />
                      <Bar dataKey="Allocation_Percentage" fill="#FFD700" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )
          )}
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-gray-600 my-12"></div>
      <h2 className="text-3xl font-bold mb-6 text-gold-400 text-center">
        ----Sample Projection----
      </h2>
      <div className="border-b border-gray-600 my-12"></div>

      {/* Sample Investment Plan */}
      <div>
        <h2 className="text-3xl font-bold mb-6 text-gold-400">
          Sample Investment Plan
        </h2>
        <Card className="p-6 bg-black/50 rounded-lg mb-12">
          <p className="text-white mb-4">
            <strong>Initial Investment:</strong> ₹
            {data.Sample_Investment_Plan.Initial_Investment}
          </p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#FFD700"
                  label
                >
                  {allocationPieData.map((_, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Projected Outcomes */}
      <div>
        <h2
          className="text-3xl font-bold mb-6 text-gold-400 cursor-pointer"
          onClick={() => openModal('Projected Outcomes')}
        >
          Projected Outcomes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {data.Projected_Outcomes.map((outcome: any, index: number) => (
            <Card
              key={index}
              className="p-6 bg-black/50 rounded-lg border border-gold-400/20 cursor-pointer"
              onClick={() => openModal('Projected Outcomes')}
            >
              <h3 className="font-semibold text-gold-400 mb-2">
                {outcome.Time_Horizon}
              </h3>
              <p className="text-white mb-2">{outcome.Details}</p>
              <p className="text-white text-sm">
                <strong>Projected Return:</strong> {outcome.Projected_Return}%
                <br />
                <strong>Risk-Adjusted Return:</strong>{' '}
                {outcome.Risk_Adjusted_Return}%
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Growth Projection */}
      <div>
        <h2 className="text-3xl font-bold mb-6 text-gold-400">
          Growth Projection
        </h2>
        <Card className="p-6 bg-black/50 rounded-lg mb-12">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient
                    id="colorProjected"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#FFD700" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="year" stroke="#FFD700" />
                <YAxis stroke="#FFD700" />
                <Tooltip content={<CustomTooltipGeneral />} />
                <Area
                  type="monotone"
                  dataKey="projected"
                  stroke="#FFD700"
                  fillOpacity={1}
                  fill="url(#colorProjected)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Modals */}
      {selectedFund !== null && (
        <Modal onClose={() => setSelectedFund(null)}>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-gold-400">
              {data.Top_Mutual_Funds[selectedFund].Fund_Name}
            </h2>
            <p className="text-white mb-2">
              <strong>Fund House:</strong>{' '}
              {data.Top_Mutual_Funds[selectedFund].Fund_House}
            </p>
            <p className="text-white mb-2">
              <strong>Scheme Category:</strong>{' '}
              {data.Top_Mutual_Funds[selectedFund].Scheme_Category}
            </p>
            <p className="text-white mb-2">
              <strong>Latest NAV:</strong> ₹
              {data.Top_Mutual_Funds[selectedFund].Latest_NAV}
            </p>
            <p className="text-white mb-4">
              <strong>Expense Ratio:</strong>{' '}
              {data.Top_Mutual_Funds[selectedFund].Expense_Ratio}%
            </p>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.Top_Mutual_Funds[selectedFund].Historical_Returns}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="Time_Period" stroke="#FFD700" />
                  <YAxis stroke="#FFD700" />
                  <Tooltip content={<CustomTooltipGeneral />} />
                  <Line
                    type="monotone"
                    dataKey="Return_Percentage"
                    stroke="#FFD700"
                    strokeWidth={2}
                    dot
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Modal>
      )}

      {modalContent === 'Investment Justifications' && (
        <Modal onClose={closeModal}>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-gold-400">
              Investment Justifications Details
            </h2>
            <p className="text-white mb-4">
              Detailed justifications for the selected investment strategies.
            </p>
            <ul className="list-disc list-inside text-white mb-4">
              {data.Justifications.map((justification: any, index: number) => (
                <li key={index}>
                  <strong>{justification.Title}:</strong>{' '}
                  {justification.Details}
                </li>
              ))}
            </ul>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.Justifications.flatMap((j) => j.Associated_Funds)}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="Fund_Name" stroke="#FFD700" />
                  <YAxis />
                  <Tooltip content={<CustomTooltipGeneral />} />
                  <Legend />
                  <Bar
                    dataKey="Scheme_Code"
                    fill="#FFD700"
                    name="Scheme Code"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Modal>
      )}

      {modalContent === 'Projected Outcomes' && (
        <Modal onClose={closeModal}>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-gold-400">
              Projected Outcomes Details
            </h2>
            <p className="text-white mb-4">
              In-depth analysis of the projected outcomes based on your
              investment strategy.
            </p>
            <div className="h-[300px] mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="year" stroke="#FFD700" />
                  <YAxis stroke="#FFD700" />
                  <Tooltip content={<CustomTooltipGeneral />} />
                  <Line
                    type="monotone"
                    dataKey="projected"
                    stroke="#FFD700"
                    strokeWidth={2}
                    dot
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <h3 className="text-xl font-semibold text-gold-400 mb-2">
              Assumptions
            </h3>
            <ul className="list-disc list-inside text-white">
              {data.Projected_Outcomes.map((outcome: any, index: number) => (
                <li key={index}>
                  <strong>{outcome.Time_Horizon}:</strong> {outcome.Assumptions}
                </li>
              ))}
            </ul>
          </div>
        </Modal>
      )}

      {selectedRisk && (
        <Modal onClose={closeModal}>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-gold-400">
              {selectedRisk.Risk} Details
            </h2>
            <p className="text-white mb-4">{selectedRisk.details}</p>
            <h3 className="text-xl font-semibold text-gold-400 mb-2">
              Associated Funds
            </h3>
            {selectedRisk.associatedFunds &&
            selectedRisk.associatedFunds.length > 0 ? (
              <ul className="list-disc list-inside text-white">
                {selectedRisk.associatedFunds.map(
                  (fund: any, index: number) => (
                    <li key={index}>{fund.Fund_Name}</li>
                  )
                )}
              </ul>
            ) : (
              <p className="text-white">No associated funds.</p>
            )}
          </div>
        </Modal>
      )}

      {selectedMarketTrend && (
        <Modal onClose={closeModal}>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-gold-400">
              {selectedMarketTrend.Trend} Details
            </h2>
            <p className="text-white mb-4">{selectedMarketTrend.Analysis}</p>
            <h3 className="text-xl font-semibold text-gold-400 mb-2">
              Supporting Data
            </h3>
            <ul className="list-disc list-inside text-white">
              {selectedMarketTrend.Supporting_Data.length > 0 ? (
                selectedMarketTrend.Supporting_Data.map((dataItem, index) => (
                  <li key={index}>
                    <strong>{dataItem.Metric}:</strong> {dataItem.Value} (
                    Change: {dataItem.Change} on {dataItem.Date})
                  </li>
                ))
              ) : (
                <p className="text-white">No supporting data available.</p>
              )}
            </ul>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Custom Tooltip for Pie Charts
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-black p-2 rounded-lg border border-gold-400 shadow-lg">
        <h4 className="text-gold-400 font-bold">{data.name}</h4>
        <p className="text-white">Allocation: {data.value}%</p>
        <p className="text-white">Investment: ₹{data.investmentAmount}</p>
        <p className="text-white">Projected Return: {data.projectedReturn}%</p>
      </div>
    );
  }

  return null;
};

// Custom Tooltip for Bar Charts
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black p-2 rounded-lg border border-gold-400 shadow-lg">
        <h4 className="text-gold-400 font-bold">{label}</h4>
        {payload.map((item: any, index: number) => (
          <p key={`item-${index}`} className="text-white">
            {item.name}: {item.value}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

// Custom Tooltip for General Charts
const CustomTooltipGeneral = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black p-2 rounded-lg border border-gold-400 shadow-lg">
        <h4 className="text-gold-400 font-bold">{label}</h4>
        {payload.map((item: any, index: number) => (
          <p key={`item-${index}`} className="text-white">
            {item.name}: {item.value}
          </p>
        ))}
      </div>
    );
  }

  return null;
};
