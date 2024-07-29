
import React from 'react';
import { View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

const data = {
  labels: ['Income', 'Expenses'],
  datasets: [
    {
      data: [5000, 3000],
    },
  ],
};

const chartConfig = {
  backgroundGradientFrom: '#1E2923',
  backgroundGradientTo: '#08130D',
  color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
};

const CashFlowChart = ({ income, expenses }) => {
  return (
    <View>
      <BarChart
        data={{
          labels: ['Income', 'Expenses'],
          datasets: [
            {
              data: [income, expenses],
            },
          ],
        }}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig}
        verticalLabelRotation={30}
      />
    </View>
  );
};

export default CashFlowChart;