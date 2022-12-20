import { PageHeader, Segmented } from "antd";
import React from "react";

// displays a page header

const styles = {
  headerBox: {
    margin: "auto",
    display: "flex",
    padding: "25px",
    flexDirection: "row",
    // max-width: 820px; margin: 32px auto auto; padding-bottom: 32px;
    maxWidth: "820px",
    justifyContent: "center",
  },
  header: {
    fontSize: "30px",
    marginRight: "20px",
    fontFamily: "monospace",
  },
  items: {
    fontSize: "20px",
    marginRight: "10px",
    display: "flex",
  },
  a: {
    color: "#26abd4", // "#ff4538",
    alignSelf: "flex-end",
    fontFamily: "monospace",
  },
};

export default function Header() {
  return (
    <>
      <div id="header" style={styles.headerBox}>
        <div style={styles.header}>g4m3 0f lif3</div>
        <div style={styles.items}>
          <a href="/" style={styles.a}>
            mint
          </a>
        </div>
        <div style={styles.items}>
          <a href="/gallery" style={styles.a}>
            gallery
          </a>
        </div>
      </div>
    </>
  );
}
