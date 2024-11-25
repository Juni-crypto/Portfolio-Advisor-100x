// File: src/components/AdvisorForm.tsx

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import axios from 'axios';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Dashboard } from './Dashboard';
import { Modal } from '@/components/ui/modal'; // Add this import

const formSchema = z.object({
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
  financialGoals: z.string().min(1, 'Please select at least one goal'),
  investmentTimeline: z.string().min(1, 'Please select a timeline'),
  monthlyIncome: z.string().min(1, 'Monthly income is required'),
  monthlyExpenses: z.string().min(1, 'Monthly expenses is required'),
  totalSavings: z.string().min(1, 'Total savings is required'),
  totalDebt: z.string().min(1, 'Total debt is required'),
});

function formatResponseToJson(response: any) {
  console.log(response);
  try {
    const regex = /```json\s*([\s\S]*?)\s*```/;
    const match = response.recommendations.match(regex);
    if (!match) {
      throw new Error('JSON block not found');
    }
    const jsonStr = match[1];
    const jsonObj = JSON.parse(jsonStr);
    const requiredFields = [
      'Market_Trends',
      'Justifications',
      'Risk_Assessment',
      'Projected_Outcomes',
    ];
    requiredFields.forEach((field) => {
      if (
        !jsonObj[field] ||
        (Array.isArray(jsonObj[field]) && jsonObj[field].length === 0)
      ) {
        jsonObj[field] = [{}];
      }
    });
    return jsonObj;
  } catch (error) {
    throw new Error('Invalid JSON response from AI.');
  }
}

export function AdvisorForm() {
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessages] = useState<string[]>([
    'Analyzing your Funds...',
    'Calculating NAV Performance...',
    'Calculating Funds as per your need...',
    'Calculating your portfolio allocation...',
  ]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [coolDownRemaining, setCoolDownRemaining] = useState<number>(0);
  const [errorModalOpen, setErrorModalOpen] = useState<boolean>(false); // Add state for modal
  const [errorMessage, setErrorMessage] = useState<string>(''); // Add state for error message

  const COOLDOWN_TIME = 90; // in seconds

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      riskTolerance: 'moderate',
      financialGoals: 'retirement',
      investmentTimeline: 'medium',
      monthlyIncome: '5000',
      monthlyExpenses: '3000',
      totalSavings: '20000',
      totalDebt: '10000',
    },
  });

  useEffect(() => {
    let messageInterval: NodeJS.Timeout;
    if (loading) {
      messageInterval = setInterval(() => {
        setCurrentMessageIndex(
          (prevIndex) => (prevIndex + 1) % loadingMessages.length
        );
      }, 5000); // Change message every 5 seconds
    } else {
      setCurrentMessageIndex(0);
    }
    return () => clearInterval(messageInterval);
  }, [loading, loadingMessages]);

  useEffect(() => {
    // Check for cooldown on component mount
    const cooldownTimestamp = localStorage.getItem('cooldownTimestamp');
    if (cooldownTimestamp) {
      const remaining = Math.ceil(
        (parseInt(cooldownTimestamp) - Date.now()) / 1000
      );
      if (remaining > 0) {
        setCoolDownRemaining(remaining);
      } else {
        localStorage.removeItem('cooldownTimestamp');
      }
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (coolDownRemaining > 0) {
      timer = setInterval(() => {
        setCoolDownRemaining((prev) => {
          if (prev <= 1) {
            localStorage.removeItem('cooldownTimestamp');
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [coolDownRemaining]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const cooldownTimestamp = localStorage.getItem('cooldownTimestamp');
    const now = Date.now();

    if (cooldownTimestamp && parseInt(cooldownTimestamp) > now) {
      const remaining = Math.ceil((parseInt(cooldownTimestamp) - now) / 1000);
      setCoolDownRemaining(remaining);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        'https://sqkkpx87r3.ap-south-1.awsapprunner.com/get-predictions',
        {
          risk_tolerance: values.riskTolerance,
          financial_goals: [values.financialGoals],
          timeline: [values.investmentTimeline],
          income: values.monthlyIncome,
          expenses: values.monthlyExpenses,
          savings: values.totalSavings,
          debt_levels: values.totalDebt,
        }
      );
      const formattedResponse = formatResponseToJson(response.data);
      setRecommendations(formattedResponse);
      // Set cooldown timestamp
      const newCooldownTimestamp = now + COOLDOWN_TIME * 1000;
      localStorage.setItem(
        'cooldownTimestamp',
        newCooldownTimestamp.toString()
      );
      setCoolDownRemaining(COOLDOWN_TIME);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setErrorMessage('AI is cooling down, please try after sometime..!');
      setErrorModalOpen(true);
      setCoolDownRemaining(COOLDOWN_TIME);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Conditionally render Modal for Error Message */}
      {errorModalOpen && (
        <Modal onClose={() => setErrorModalOpen(false)} title="Error">
          <p className="text-white">{errorMessage}</p>
          <Button onClick={() => setErrorModalOpen(false)} className="mt-4">
            Close
          </Button>
        </Modal>
      )}

      {recommendations ? (
        <Dashboard data={recommendations} />
      ) : (
        <>
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              {/* Animated Loading Icon */}
              <div className="w-16 h-16 border-4 border-gold-400 border-t-transparent rounded-full animate-spin"></div>
              {/* Loading Messages */}
              <p className="text-xl text-gold-400">
                {loadingMessages[currentMessageIndex]}
              </p>
            </div>
          ) : coolDownRemaining > 0 ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-xl text-gold-400">
                AI is cooling down, please wait for {coolDownRemaining} seconds.
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6 w-full max-w-2xl mx-auto bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-gold-400/30"
              >
                <FormField
                  control={form.control}
                  name="riskTolerance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gold-400">
                        Risk Tolerance
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-gold-400/30 bg-black/50">
                            <SelectValue placeholder="Select your risk tolerance" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white/95 text-black border-gold-400/30">
                          <SelectItem value="conservative">Conservative</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="aggressive">Aggressive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="financialGoals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gold-400">
                        Financial Goals
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-gold-400/30 bg-black/50">
                            <SelectValue placeholder="Select your financial goals" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white/95 text-black border-gold-400/30">
                          <SelectItem value="retirement">Retirement</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="wealth">
                            Wealth Accumulation
                          </SelectItem>
                          <SelectItem value="property">
                            Property Investment
                          </SelectItem>
                          <SelectItem value="business">
                            Business Development
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="investmentTimeline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gold-400">
                        Investment Timeline
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-gold-400/30 bg-black/50">
                            <SelectValue placeholder="Select your investment timeline" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white/95 text-black border-gold-400/30">
                          <SelectItem value="short">
                            Short-term (0-2 years)
                          </SelectItem>
                          <SelectItem value="medium">
                            Medium-term (2-5 years)
                          </SelectItem>
                          <SelectItem value="long">Long-term (5+ years)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="monthlyIncome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gold-400">
                          Monthly Income
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="₹"
                            {...field}
                            className="border-gold-400/30 bg-black/50 placeholder:text-gray-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="monthlyExpenses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gold-400">
                          Monthly Expenses
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="₹"
                            {...field}
                            className="border-gold-400/30 bg-black/50 placeholder:text-gray-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalSavings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gold-400">
                          Total Savings
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="₹"
                            {...field}
                            className="border-gold-400/30 bg-black/50 placeholder:text-gray-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalDebt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gold-400">Total Debt</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="₹"
                            {...field}
                            className="border-gold-400/30 bg-black/50 placeholder:text-gray-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || coolDownRemaining > 0}
                  className={cn(
                    'w-full bg-gradient-to-r from-gold-400 to-gold-600 text-black',
                    'hover:from-gold-500 hover:to-gold-700 transition-all duration-300',
                    'font-semibold text-lg py-6',
                    (loading || coolDownRemaining > 0) &&
                      'opacity-50 cursor-not-allowed'
                  )}
                >
                  {loading ? 'Analyzing...' : "Let's Plan...!"}
                </Button>
              </form>
            </Form>
          )}
        </>
      )}
    </>
  );
}

export default AdvisorForm;