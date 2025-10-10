import { useEffect, useRef } from "react";
import type { SupersetWidgetConfig, SupersetFilter } from "./supersetModel";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";
import { useColor } from "./ColorContext";

export function BarWidget({
  config,
  data,
}: {
  config: SupersetWidgetConfig;
  filters?: SupersetFilter[];
  data: any[];
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const colorContext = useColor();

  useEffect(() => {
    if (chartRef.current && data.length > 0) {
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current);
      }

      const { params } = config;
      const xAxisColumn = params.x_axis.column;
      const seriesColumn = params.metrics[0].column.column_name;
      const metricConfig = config.params.metrics?.[0];
      let metricLabel: string;

      if (typeof metricConfig === "string") {
        metricLabel = metricConfig;
      } else if (
        metricConfig &&
        typeof metricConfig === "object" &&
        "label" in metricConfig
      ) {
        metricLabel = metricConfig.label;
      } else {
        metricLabel = "value"; // Fallback
      }

      const xAxisData = Array.from(
        new Set(data.map((row) => row[xAxisColumn]))
      ).sort();

      let series = [];
      let legendData: string[] = [];
      if (seriesColumn) {
        const uniqueSeriesValues = Array.from(
          new Set(data.map((row) => row[seriesColumn]).filter((r) => r))
        ).sort();
        legendData = uniqueSeriesValues as string[];

        const seriesDataMap = new Map<string, Map<string, number>>();
        uniqueSeriesValues.forEach((s) => seriesDataMap.set(s, new Map()));

        data.forEach((row) => {
            const xVal = row[xAxisColumn];
            const seriesVal = row[seriesColumn];
            if (xVal && seriesVal) {
                seriesDataMap.get(seriesVal)!.set(xVal, row[metricLabel]);
            }
        });

        series = uniqueSeriesValues.map((seriesVal) => {
          const color = colorContext?.getColor(seriesColumn, seriesVal);
          return {
            name: seriesVal,
            type: "bar",
            stack: config.params.stack === "Stack" ? "total" : undefined,
            emphasis: {
              focus: "series",
            },
            itemStyle: { color },
            data: xAxisData.map((xVal) => {
              return seriesDataMap.get(seriesVal)?.get(xVal) || 0;
            }),
            label: {
              show: config.params.show_value,
              position: "inside",
              formatter: "{c}",
            },
          };
        });
      } else {
        // Fallback for single series if no distinct series column is found
        legendData = [metricLabel];
        series = [
          {
            name: metricLabel,
            type: "bar",
            stack: config.params.stack === "Stack" ? "total" : undefined,
            emphasis: {
              focus: "series",
            },
            data: xAxisData.map((xVal) => {
              const row = data.find((r) => r[xAxisColumn] === xVal);
              return row ? row[metricLabel] : 0;
            }),
            label: {
              show: config.params.show_value,
              position: "inside",
              formatter: "{c}",
            },
          },
        ];
      }

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
            rotate: config.params.x_axis.labelRotation || 0,
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
  }, [data, config, colorContext]);

  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  if (!data.length) return <div>Loading Bar Chart…</div>;

  return <div ref={chartRef} style={{ width: "100%", height: "400px" }} />;
}
