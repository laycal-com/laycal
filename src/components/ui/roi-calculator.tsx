'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export function ROICalculator() {
  const [callsPerDay, setCallsPerDay] = useState(100);
  const [humanCallerSalary, setHumanCallerSalary] = useState(50000);

  const aiCostPerMinute = 0.37;
  const avgCallDuration = 1;
  const workingDaysPerYear = 365;
  const callsPerHumanPerDay = 80;

  const aiAnnualCost = callsPerDay * avgCallDuration * aiCostPerMinute * workingDaysPerYear;
  const humansNeeded = Math.ceil(callsPerDay / callsPerHumanPerDay);
  const humanAnnualCost = humansNeeded * humanCallerSalary;
  const savings = humanAnnualCost - aiAnnualCost;
  const savingsPercentage = ((savings / humanAnnualCost) * 100).toFixed(0);

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl border-2 border-blue-100 bg-gradient-to-br from-white to-blue-50">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-[#1e40af]">
          💰 ROI Calculator
        </CardTitle>
        <CardDescription className="text-lg">
          Calculate your potential savings with AI-powered calling
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-6">
          <div>
            <Label className="text-lg font-semibold text-gray-700">
              Calls per day: <span className="text-[#1e40af]">{callsPerDay}</span>
            </Label>
            <Slider
              value={[callsPerDay]}
              onValueChange={(value) => setCallsPerDay(value[0])}
              min={10}
              max={1000}
              step={10}
              className="mt-3"
            />
          </div>

          <div>
            <Label className="text-lg font-semibold text-gray-700">
              Human caller annual salary: <span className="text-[#1e40af]">${humanCallerSalary.toLocaleString()}</span>
            </Label>
            <Slider
              value={[humanCallerSalary]}
              onValueChange={(value) => setHumanCallerSalary(value[0])}
              min={30000}
              max={100000}
              step={5000}
              className="mt-3"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 pt-6 border-t-2 border-blue-200">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border-2 border-red-200"
          >
            <div className="text-sm font-semibold text-red-600 mb-2">Traditional Calling</div>
            <div className="text-3xl font-bold text-red-700 mb-1">
              ${humanAnnualCost.toLocaleString()}
            </div>
            <div className="text-xs text-red-600">
              {humansNeeded} caller{humansNeeded > 1 ? 's' : ''} × ${humanCallerSalary.toLocaleString()}/year
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200"
          >
            <div className="text-sm font-semibold text-green-600 mb-2">AI-Powered Calling</div>
            <div className="text-3xl font-bold text-green-700 mb-1">
              ${aiAnnualCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-green-600">
              ${aiCostPerMinute}/min × {avgCallDuration} min avg × {callsPerDay} calls/day × {workingDaysPerYear} days
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] text-white p-8 rounded-2xl text-center shadow-2xl"
        >
          <div className="text-sm font-semibold mb-2 text-blue-100">Your Annual Savings</div>
          <div className="text-5xl font-bold mb-3">
            ${savings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-2xl font-semibold text-yellow-300">
            Save {savingsPercentage}% with Laycal
          </div>
          <div className="mt-4 text-sm text-blue-100">
            That's {callsPerDay * workingDaysPerYear} calls per year at a fraction of the cost!
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
