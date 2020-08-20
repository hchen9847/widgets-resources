import { createElement, ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import { VictoryBar, VictoryChart, VictoryAxis, VictoryLabel } from "victory-native";

// import { ChartsProps } from "../typings/ChartsProps";

const data = [
    { quarter: 1, earnings: 13000 },
    { quarter: 2, earnings: 16500 },
    { quarter: 3, earnings: 14250 },
    { quarter: 4, earnings: 19000 }
];

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    }
});

export function Charts(): ReactElement {
    return (
        <View style={styles.container}>
            <VictoryChart width={300} padding={{ left: 90, top: 60, bottom: 60, right: 10 }} domainPadding={{ x: 25 }}>
                <VictoryLabel x={150} y={30} text="Bar chart" textAnchor={"middle"} style={{ fontSize: 20 }} />

                <VictoryAxis
                    axisLabelComponent={<VictoryLabel dy={10} />}
                    tickValues={[1, 2, 3, 4]}
                    tickFormat={["Q1", "Q2", "Q3", "Q4"]}
                    label={"Quaters 2019"}
                />
                <VictoryAxis
                    dependentAxis
                    axisLabelComponent={<VictoryLabel dy={-40} />}
                    label={"Earnings ($)"}
                    style={{ grid: { stroke: "#818e99", strokeWidth: 1 } }}
                />

                <VictoryBar
                    data={data}
                    x="quarter"
                    y="earnings"
                    barWidth={20}
                    style={{
                        data: { fill: "#0595DB" }
                    }}
                    animate={{
                        duration: 2000
                    }}
                />
            </VictoryChart>
        </View>
    );
}
