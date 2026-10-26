// src/components/EmotionHeatmapSection.tsx - 情绪热力视图模块

import React, { useRef, useEffect } from 'react';
import { Card, Button, message } from 'antd';
import * as echarts from 'echarts';
import type { EmotionHeatmapResponse } from '@/types';

export const EmotionHeatmapSection: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 初始化图表
  useEffect(() => {
    if (chartRef.current) {
      const chartInstance = echarts.init(chartRef.current);
      setChart(chartInstance);
      
      return () => {
        if (chartInstance) {
          chartInstance.dispose();
        }
      };
    }
  }, []);

  const generateHeatmap = async () => {
    if (!chart) return;
    
    setLoading(true);
    try {
      // await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟情绪分析数据
      const mockData: EmotionHeatmapResponse = {
        topics: ['预算调整', 'Q3计划', '招聘政策'],
        speakers: [['张三', '李四', '王五'], ['张三', '李四', '王五'], ['张三', '李四', '王五', '赵六']],
        cells: [
          [{ value: 0.85, color: 'red', original_text: '张三：预算应该增加' }, 
           { value: -0.9, color: 'red', original_text: '李四：要削减预算' },
           { value: 0.45, color: 'yellow', original_text: '王五：适度支持' }],
          [{ value: 0.7, color: 'green', original_text: '张三：计划很清晰' },
           { value: 0.65, color: 'green', original_text: '李四：资源已准备' },
           { value: 0.75, color: 'green', original_text: '王五：同意推进' }],
          [{ value: 0.8, color: 'red', original_text: '张三：扩大招聘规模' },
           { value: -0.85, color: 'red', original_text: '李四：要考虑成本' },
           { value: -0.3, color: 'blue', original_text: '王五：再研究一下' },
           { value: 0.0, color: 'green', original_text: '赵六：持中立态度' }]
        ],
        divergenceIndex: 1.75,
        consensusRate: 0.25
      };
      
      // 设置ECharts选项
      const option = {
        tooltip: {
          position: 'top',
          formatter: function(params: any) {
            const cell = params.data;
            return `<strong>议题：</strong>${topics[params.dataIndex]}<br/>
                    <strong>发言人：</strong>${speakers[params.dimensionIndex][params.dataIndex]}<br/>
                    <strong>情感值：</strong>{cell.value}<br/>
                    <strong>原文：</strong>{cell.original_text}`;
          },
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderColor: '#1890ff',
          borderWidth: 1
        },
        grid: {
          height: '65%',
          top: '10%',
          left: '15%',
          right: '10%'
        },
        xAxis: {
          type: 'category',
          data: mockData.topics,
          name: '讨论议题',
          nameLocation: 'middle',
          nameGap: 25
        },
        yAxis: {
          type: 'category',
          data: mockData.speakers[0], // 使用第一行的发言人作为Y轴标签
          name: '发言人',
          nameLocation: 'middle',
          nameGap: 30
        },
        series: [{
          name: '情感强度',
          type: 'heatmap',
          data: mockData.cells.map((row, i) => 
            row.map((cell, j) => ({ value: [j, i, cell.value], itemStyle: { color: cell.color } }))
          ),
          label: {
            show: true,
            position: 'inside',
            formatter: function(params: any) {
              const val = params.value[2];
              if (val > 0.7) return '强支';
              if (val > 0.3) return '支';
              if (val > -0.3) return '中';
              if (val > -0.8) return '?';
              return '反';
            },
            fontSize: 11,
            fontWeight: 'bold'
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0,0,0,0.5)'
            }
          },
          color: ['#dc143c', '#ffa500', '#008000', '#0000ff', '#8B0000']
        }],
        graphic: [{
          type: 'group',
          left: 'center',
          top: '90%',
          children: [{
            type: 'rect',
            shape: { width: 120, height: 20 },
            style: { fill: '#dc143c' }
          }, {
            type: 'text',
            style: { fill: '#fff', text: '强烈反对', x: 60, y: 14, fontSize: 10, textAlign: 'center' }
          }]
        }, {
          type: 'group',
          left: 'center',
          top: '90%',
          children: [{
            type: 'rect',
            shape: { width: 120, height: 20 },
            style: { fill: '#ffa500' }
          }, {
            type: 'text',
            style: { fill: '#000', text: '中度观点', x: 60, y: 14, fontSize: 10, textAlign: 'center' }
          }]
        }, {
          type: 'group',
          left: 'center',
          top: '90%',
          children: [{
            type: 'rect',
            shape: { width: 120, height: 20 },
            style: { fill: '#008000' }
          }, {
            type: 'text',
            style: { fill: '#fff', text: '中性', x: 60, y: 14, fontSize: 10, textAlign: 'center' }
          }]
        }, {
          type: 'group',
          left: 'center',
          top: '90%',
          children: [{
            type: 'rect',
            shape: { width: 120, height: 20 },
            style: { fill: '#0000ff' }
          }, {
            type: 'text',
            style: { fill: '#fff', text: '疑问/存疑', x: 60, y: 14, fontSize: 10, textAlign: 'center' }
          }]
        }]
      };
      
      chart.setOption(option, true);
      
      // 显示衍生指标信息
      message.info({
        message: '情绪热力分析完成',
        description: `分歧指数: ${mockData.divergenceIndex.toFixed(2)} | 共识度: ${(mockData.consensusRate * 100).toFixed(1)}%`,
        duration: 3
      });
      
    } catch (err) {
      console.error(err);
      message.error('情绪分析失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="emotion-heatmap-section">
      <h3 className="section-title">💡 情绪热力视图（独创特色）</h3>
      
      <Card>
        <Button type="primary" onClick={generateHeatmap} loading={loading} style={{ marginBottom: '1rem' }}>
          生成情绪热力图
        </Button>
        
        <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '1rem', marginBottom: '1rem' }}>
          红色=强烈支持/反对  |  黄色=中度观点  |  绿色=中性  |  蓝色=疑问/存疑
        </p>
        
        <div ref={chartRef} style={{ width: '100%', height: '400px' }}></div>
        
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
          <strong>解读示例：</strong><br/>
          • 红对红（高分歧）→ 需先行协调<br/>
          • 绿绿绿（高共识）→ 可直接推进<br/>
          • 多问号（信息不足）→ 需补充材料
        </div>
      </Card>
    </div>
  );
};
