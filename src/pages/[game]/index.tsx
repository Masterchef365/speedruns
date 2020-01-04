import React from "react";
import { useRouter } from "next/router";
import { NextPage } from "next";

import "../../pages-lib/styles.scss";

const GamePage: NextPage = () => {
  const router = useRouter();

  return <p>game: {router.query.game}</p>;
};

export default GamePage;
