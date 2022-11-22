import { PageHeader, Segmented } from "antd";
import React from "react";

// displays a page header

const styles = {
  headerBox: {
    margin: "30px",
    display: "flex",
    padding: "25px",
    flexDirection: "row",
  },
  header: {
    fontSize: "30px",
    marginRight: "20px",
  },
  items: {
    fontSize: "20px",
    marginRight: "10px",
    display: "flex",
  },
  a: {
    color: "#ff4538",
    alignSelf: "flex-end",
  },
};

export default function Header() {
  return (
    <>
      <div id="header" style={styles.headerBox}>
        <div style={styles.header}>gam3 0f lif3</div>
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
