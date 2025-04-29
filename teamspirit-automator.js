// ====================
// 使い方
// ====================
//
// 1. 対象者
// - salesforce(<https://login.salesforce.com/>)でWeb勤務表を利用している人
// 2. 利用方法
// - salesforceにログインし、勤務表ページを開く
// - 開発者ツール > コンソールを開き、本コードを全量を張り付ける
// - 個人設定変数`config` を編集する（編集方法はコメントに記載の通り）
//

/**
 * 個人設定
 */
var config = {
  startDD: 1, // 日: 入力を開始したい日付
  endDD: 30, // 31日までを入力候補とします。
  sleepTime: 3000, // 遷移の待ち時間（ミリ秒）: ３秒推奨。３秒あれば各トラン処理が終了する想定
  resetFlg: false, // 入力項目をリセットするかどうか true/false
  defaultStartTime: "10:00", // 設定したい勤務開始時刻
  defaultEndTime: "19:00", // 設定したい勤務終了時刻

  // 拡張設定
  workModeType: "workOnly", // 処理モード: "both" (勤務時間と工数), "timeOnly" (勤務時間のみ), "workOnly" (工数のみ)
  workTime: "8:00", // 1日あたりの工数時間
};

// ===== 処理領域 =====

/**
 * スリープ関数
 * @param {number} msec
 */
function sleep(msec) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve();
    }, msec);
  });
}

/**
 * 確認ダイアログ自動承諾関数
 */
async function checkAndHandleConfirmDialog() {
  // 確認ダイアログが表示されているか確認
  const confirmDialog = document.getElementById("confirmAlertDialog");
  if (
    confirmDialog &&
    window.getComputedStyle(confirmDialog).display !== "none"
  ) {
    // OKボタンをクリック
    const confirmButton = document.getElementById("confirmAlertOk");
    if (confirmButton) {
      console.log("確認ダイアログを自動承諾します");
      confirmButton.click();
      // クリック後少し待つ
      await sleep(1000);
      return true;
    }
  }
  return false;
}

/**
 * 工数入力ダイアログを処理する関数
 */
async function handleWorkBalanceDialog() {
  const workDialog = document.getElementById("dialogWorkBalance");

  if (workDialog && window.getComputedStyle(workDialog).display !== "none") {
    console.log("工数入力ダイアログを処理します");

    // 工数時間を入力
    const timeInput = document.getElementById("empInputTime0");
    if (timeInput) {
      timeInput.value = config.workTime;

      // input イベントを発火して値の変更を登録
      const event = new Event("input", { bubbles: true });
      timeInput.dispatchEvent(event);
    }

    // 登録ボタンをクリック
    await sleep(1000);
    const registerButton = document.getElementById("empWorkOk");
    if (registerButton) {
      registerButton.click();
      await sleep(2000);
    }

    return true;
  }

  return false;
}

/**
 * 工数入力を開始する関数
 */
async function startWorkInput(yyyy, mm, dd) {
  // 工数ボタンをクリック
  const workCell = document.getElementById(`dailyWorkCell${yyyy}-${mm}-${dd}`);
  if (workCell) {
    workCell.click();
    console.log(`工数入力セルをクリック: ${yyyy}-${mm}-${dd}`);
    await sleep(2000);

    // 工数入力ダイアログを処理
    await handleWorkBalanceDialog();

    console.log(`工数入力完了: ${yyyy}-${mm}-${dd}`);
    return true;
  }

  return false;
}

/**
 * メイン関数
 */
async function main(config) {
  // === 個人設定 START ===
  let yyyy = document.getElementById("yearMonthList").value.slice(0, 4); // 年: 選択している年
  let mm = document.getElementById("yearMonthList").value.slice(4, 6); // 月: 選択している月
  let dd = config.startDD;
  const end_dd = config.endDD;
  const sleep_time = config.sleepTime;
  let defaultStartTime = null;
  let defaultEndTime = null;

  // 勤務時間モードの設定
  const doTimeInput =
    config.workModeType === "both" || config.workModeType === "timeOnly";
  // 工数モードの設定
  const doWorkInput =
    config.workModeType === "both" || config.workModeType === "workOnly";

  if (config.resetFlg) {
    defaultStartTime = ""; // リセット
    defaultEndTime = ""; // リセット
  } else {
    defaultStartTime = config.defaultStartTime;
    defaultEndTime = config.defaultEndTime;
  }
  // === 個人設定 END ===

  var t_red = "\u001b[31m";
  var t_green = "\u001b[32m";
  var reset = "\u001b[0m";

  // ポップアップ判定
  let dialogInputTime = document.getElementById("dialogInputTime");
  let dialogWorkBalance = document.getElementById("dialogWorkBalance");

  // ==============================
  // エラーチェック
  // ==============================
  if (dd >= end_dd) {
    window.alert(
      `「日付の設定値に誤りがあります。 dd: ${dd} - end_dd: ${end_dd} 」`,
    );
    console.log(`${t_red}%s${reset}`, "日付設定値不正");
    return;
  }

  // ==============================
  // 画面判定
  // ==============================

  // 工数入力ダイアログが表示されている場合
  if (
    dialogWorkBalance &&
    window.getComputedStyle(dialogWorkBalance).display !== "none"
  ) {
    if (doWorkInput) {
      await handleWorkBalanceDialog();
    } else {
      // 工数入力をスキップする場合はキャンセル
      const cancelButton = document.getElementById("empWorkCancel");
      if (cancelButton) cancelButton.click();
    }
    await sleep(sleep_time);
    await main(config);
    return;
  }

  // 勤務時間入力ダイアログが表示されている場合
  if (dialogInputTime) {
    if (doTimeInput) {
      // 勤務時間を入力
      document.getElementById("startTime").value = defaultStartTime;
      document.getElementById("endTime").value = defaultEndTime;
      document.getElementById("dlgInpTimeOk").click();

      // 確認ダイアログ対応（休憩不足の確認）
      await sleep(1000);
      await checkAndHandleConfirmDialog();

      if (config.resetFlg) {
        // リセット判定
        await sleep(1000);
        if (document.getElementById("messageBoxOk"))
          document.getElementById("messageBoxOk").click();
      }
      console.log(`${t_green}%s${reset}`, "-- 勤務時間登録完了");
    } else {
      // 勤務時間入力をスキップする場合はキャンセル
      const cancelButton = document.getElementById("dlgInpTimeCancel");
      if (cancelButton) cancelButton.click();
      console.log(`${t_green}%s${reset}`, "-- 勤務時間入力をスキップしました");
    }

    await sleep(sleep_time);
    await main(config);
    return;
  }

  // 勤務表メイン画面の場合
  // 未入力またはリセット対象の日を探す
  let targetDate = null;
  let isWorkInputTarget = false;

  for (let i = 0; dd <= end_dd; i++) {
    dd =
      i != 0 ? String(~~dd + 1).padStart(2, "0") : String(dd).padStart(2, "0");

    // 勤務時間入力対象を探す
    if (doTimeInput) {
      let selectElement = document.getElementById(
        `ttvTimeSt${yyyy}-${mm}-${dd}`,
      );
      if (selectElement) {
        if (config.resetFlg && selectElement.innerText != "") {
          targetDate = dd;
          isWorkInputTarget = false;
          break;
        } else if (!config.resetFlg && selectElement.innerText == "") {
          targetDate = dd;
          isWorkInputTarget = false;
          break;
        }
      }
    }

    // 工数入力対象を探す（勤務時間が入力済みの場合）
    if (doWorkInput) {
      let timeElement = document.getElementById(`ttvTimeSt${yyyy}-${mm}-${dd}`);
      let workElement = document.getElementById(
        `dailyWorkCell${yyyy}-${mm}-${dd}`,
      );

      // 勤務時間が入力済みで工数を入力する場合
      if (timeElement && workElement && timeElement.innerText != "") {
        // 工数入力が必要なら（工数アイコンが表示されている場合）
        if (
          workElement.querySelector(".workng") ||
          workElement.querySelector(".png-add")
        ) {
          targetDate = dd;
          isWorkInputTarget = true;
          break;
        }
      }
    }
  }

  // 対象日が見つかった場合の処理
  if (targetDate) {
    if (isWorkInputTarget) {
      // 工数入力対象
      console.log(
        `${t_green}%s${reset}`,
        `-- 工数入力対象日: ${yyyy}-${mm}-${targetDate}`,
      );
      await startWorkInput(yyyy, mm, targetDate);
    } else {
      // 勤務時間入力対象
      console.log(
        `${t_green}%s${reset}`,
        `-- 勤務時間入力対象日: ${yyyy}-${mm}-${targetDate}`,
      );
      let selectElement = document.getElementById(
        `ttvTimeSt${yyyy}-${mm}-${targetDate}`,
      );
      if (selectElement) {
        selectElement.click();
      }
    }

    await sleep(sleep_time);
    await main(config);
  } else {
    // 処理対象がない場合は終了
    window.confirm("「処理が終了しました。」");
    console.log(`${t_green}%s${reset}`, "-- 終了");
  }
}

// 処理起動
await main(config);
