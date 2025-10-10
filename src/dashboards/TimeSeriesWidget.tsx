import { useEffect, useRef } from "react";
import type { SupersetWidgetConfig, SupersetFilter } from "./supersetModel";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";

export function TimeSeriesWidget({
  config,
  data,
}: {
  config: SupersetWidgetConfig;
  filters?: SupersetFilter[];
  data: any[];
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (chartRef.current && data.length > 0) {
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current);
      }

      const { params } = config;
      const xAxisColumn = params.x_axis;
      const groupByColumn = params.groupBy?.[0];
      const metric = params.metrics[0];
      const metricLabel = typeof metric === "string" ? metric : metric.label;

      const xAxisData = Array.from(
        new Set(data.map((row) => new Date(row[xAxisColumn]).toLocaleString()))
      ).sort();

      let series = [];
      let legendData: string[] = [];
      if (groupByColumn) {
        const uniqueSeriesValues = Array.from(
          new Set(data.map((row) => row[groupByColumn]).filter((r) => r))
        );
        legendData = uniqueSeriesValues as string[];

        series = uniqueSeriesValues.map((seriesVal) => {
          const serieData = xAxisData.map((xVal) => {
            const row = data.find((r) => {
              return r[groupByColumn] === seriesVal && new Date(r[xAxisColumn]).toLocaleString() === xVal;
            });
            debugger;
            return row ? row[metric.label] : 0;
          });
          return {
            name: seriesVal,
            type: "line",
            stack: config.params.stack === "Stack" ? "total" : undefined,
            emphasis: {
              focus: "series",
            },
            data: serieData,
            label: {
              show: config.params.show_value,
              position: "top",
              formatter: "{c}",
            },
          };
        });
      } else {
        legendData = [metricLabel];
        series = [
          {
            name: metricLabel,
            type: "line",
            stack: config.params.stack === "Stack" ? "total" : undefined,
            emphasis: {
              focus: "series",
            },
            data: xAxisData.map((xVal) => {
              const row = data.find(
                (r) => new Date(r[xAxisColumn]).toLocaleString() === xVal
              );
              return row ? row[metricLabel] : 0;
            }),
            label: {
              show: config.params.show_value,
              position: "top",
              formatter: "{c}",
            },
          },
        ];
      }
      debugger;
      const option: EChartsOption = {
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
        },
        legend: {
          show: config.params.show_legend,
          type: config.params.legendType,
          orient:
            config.params.legendOrientation === "top"
              ? "horizontal"
              : "vertical",
          top: config.params.legendOrientation === "top" ? "top" : "center",
          left: config.params.legendOrientation === "top" ? "center" : "left",
          data: legendData,
        },
        xAxis: {
          type: "category",
          data: xAxisData,
          axisLabel: {
            rotate: config.params.x_axis_label_rotation || 0,
          },
        },
        yAxis: {
          type: "value",
          name: config.params.y_axis_title,
        },
        series: series,
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true,
        },
      };

      chartInstance.current.setOption(option);
    }
  }, [data, config]);

  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  if (!data.length) return <div>Loading Time Series Chart...</div>;

  return <div ref={chartRef} style={{ width: "100%", height: "400px" }} />;
}
