(() => {
  "use strict";

  // ==============================
  // Paths (match PsychoPy)
  // ==============================
  const PATHS = {
    instruction: "InstructionImages",
    memory: "MemoryStimuli",
    cue: "CueStimuli",
  };

  // ==============================
  // Font
  // ==============================
  const FONT_FAMILY =
    '"Microsoft YaHei UI","Microsoft YaHei","PingFang SC","Noto Sans CJK SC",sans-serif';

  // ==============================
  // Memory stimuli (7)
  // ==============================
  const MEM_POOL = [
    `${PATHS.memory}/stim_0089.png`,
    `${PATHS.memory}/stim_0095.png`,
    `${PATHS.memory}/stim_0307.png`,
    `${PATHS.memory}/stim_0395.png`,
    `${PATHS.memory}/stim_0405.png`,
    `${PATHS.memory}/stim_0652.png`,
    `${PATHS.memory}/stim_0797.png`,
  ];

  // ==============================
  // Cue pairs (emoji + stim fixed)
  // ==============================
  const CUE_PAIRS = [
    ["anger.png",     "stim_0001_anger.png"],
    ["calmness.png",  "stim_circular-041_calmness.png"],
    ["disgust.png",   "stim_dim1-074_disgust.png"],
    ["fear.png",      "stim_dim2-fear.png"],
    ["happiness.png", "stim_0262_happiness.png"],
    ["sadness.png",   "stim_0806_sadness.png"],
    ["surprise.png",  "stim_0889_surprise.png"],
  ].map(([emoji, stim]) => [`${PATHS.cue}/${emoji}`, `${PATHS.cue}/${stim}`]);

  // ==============================
  // Instruction images
  // ==============================
  const INSTR = {
    welcome:        `${PATHS.instruction}/welcome.png`,
    procedure:      `${PATHS.instruction}/procedure.png`,
    practice_intro: `${PATHS.instruction}/practice_intro.png`,
    practice_fail:  `${PATHS.instruction}/practice_fail.png`,
    formal_intro:   `${PATHS.instruction}/formal_intro.png`,
    break:          `${PATHS.instruction}/break.png`,
    end:            `${PATHS.instruction}/end.png`,
  };

  // ==============================
  // Keys (same as PsychoPy)
  // ==============================
  const SAME_KEY = "j";
  const DIFF_KEY = "f";
  const QUIT_KEY = "escape";

  // ==============================
  // Parameters (same as PsychoPy)
  // ==============================
  const N_PRACTICE = 5;
  const N_BLOCK1 = 8;
  const N_BLOCK2 = 8;

  const PASS_CRITERION = 0.8;

  const FIX_DUR = 1.0;        // s
  const MEM_DUR = 0.5;        // s
  const CUE_DUR = 1.0;        // s
  const PROBE_MAX_RT = 3.0;   // s

  const CONNECT_MIN = 5, CONNECT_MAX = 15;   // s
  const SEND_MIN = 0.2, SEND_MAX = 1.5;      // s

  // Pixel units (match PsychoPy)
  const POS_L_X = -420;
  const POS_R_X =  420;
  const POS_Y   = 0;
  const IMG_W = 194, IMG_H = 194;

  // ==============================
  // Ordered CSV columns
  // ==============================
  const ORDERED_FIELDS = [
    "name", "birthdate", "gender", "handedness",
    "block", "trial", "isPractice",
    "condition", "congruency", "cueSide", "probeSide", "isSame",
    "memL", "memR", "emoji_fn", "stim_fn", "probeStim",
    "respKey", "rt", "acc", "sendDur"
  ];

  // ==============================
  // Utils
  // ==============================
  const randFloat = (min, max) => Math.random() * (max - min) + min;
  const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  function makeFlagsRatio(n, ratio1) {
    const n1 = Math.round(n * ratio1);
    const flags = Array(n1).fill(1).concat(Array(n - n1).fill(0));
    return shuffle(flags);
  }

  // ==============================
  // Trial generation (same logic as PsychoPy)
  // ==============================
  function makeTrials(nTrials, congRatio = 0.60, condRatio = 0.50) {
    const condFlags = makeFlagsRatio(nTrials, condRatio); // 1=emoji,0=complexStimulus
    const nEmoji = condFlags.reduce((s, x) => s + x, 0);
    const nComp  = nTrials - nEmoji;

    const congEmoji = makeFlagsRatio(nEmoji, congRatio); // 1=congruent
    const congComp  = makeFlagsRatio(nComp,  congRatio);
    const sameFlags = makeFlagsRatio(nTrials, 0.50);     // 1=same

    let idxE = 0, idxC = 0;
    const trials = [];

    for (let i = 0; i < nTrials; i++) {
      const memPick = shuffle(MEM_POOL).slice(0, 2);
      let memL = memPick[0], memR = memPick[1];
      if (Math.random() >= 0.5) [memL, memR] = [memR, memL];

      const [emojiPath, stimPath] = choice(CUE_PAIRS);
      const emoji_fn = emojiPath.split("/").pop();
      const stim_fn  = stimPath.split("/").pop();

      const cueSide = Math.random() < 0.5 ? "left" : "right";
      const condition = condFlags[i] === 1 ? "emoji" : "complexStimulus";

      let congruentFlag;
      if (condition === "emoji") congruentFlag = congEmoji[idxE++];
      else congruentFlag = congComp[idxC++];

      const congruency = congruentFlag === 1 ? "congruent" : "incongruent";
      const opposite = cueSide === "left" ? "right" : "left";

      let probeSide;
      if (condition === "emoji") {
        probeSide = (congruentFlag === 1) ? cueSide : opposite;
      } else {
        probeSide = (congruentFlag === 1) ? opposite : cueSide;
      }

      const isSame = sameFlags[i];

      let probeStim;
      if (isSame === 1) {
        probeStim = (probeSide === "left") ? memL : memR; // LOCATION-BINDING
      } else {
        const remain = MEM_POOL.filter(x => x !== memL && x !== memR);
        probeStim = choice(remain);
      }

      trials.push({
        memL, memR,
        emojiPath, stimPath,
        emoji_fn, stim_fn,
        cueSide,
        condition,
        congruency,
        isSame,
        probeSide,
        probeStim
      });
    }

    return trials;
  }

  // ==============================
  // CSV helpers
  // ==============================
  function rowsToOrderedCSV(rows) {
    const esc = (v) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const header = ORDERED_FIELDS.join(",");
    const lines = rows.map(r => ORDERED_FIELDS.map(k => esc(r[k])).join(","));
    return [header, ...lines].join("\n");
  }

  function downloadCSV(filename, text) {
    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function downloadNow(tag = "ordered") {
    const subj = window.__subj || { name: "NA" };
    const safeName = (subj.name || "NA").trim().replace(/\s+/g, "_") || "NA";
    const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
    const filename = `${safeName}_EmojiSocial_${stamp}_${tag}.csv`;
    downloadCSV(filename, rowsToOrderedCSV(window.__rows || []));
  }

  // ==============================
  // Layout helpers (pix-like positioning)
  // ==============================
  function pxSceneHTML(inner) {
    return `
      <div style="
        width:100vw;height:100vh;
        position:relative;
        font-family:${FONT_FAMILY};
        color:#000;
      ">
        ${inner}
      </div>
    `;
  }

  function imgAt(path, x, y) {
    const left = `calc(50% + ${x}px)`;
    const top  = `calc(50% + ${y}px)`;
    return `
      <img src="${path}"
        style="
          position:absolute;
          left:${left}; top:${top};
          transform: translate(-50%,-50%);
          width:${IMG_W}px; height:${IMG_H}px;
        ">
    `;
  }

  function fixAtCenter() {
    return `
      <div style="
        position:absolute;
        left:50%; top:50%;
        transform: translate(-50%,-50%);
        font-size:90px;
        line-height:1;
        font-weight:700;
      ">+</div>
    `;
  }

  // ==============================
  // jsPsych trials
  // ==============================
  function fixationTrial() {
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: pxSceneHTML(fixAtCenter()),
      choices: "NO_KEYS",
      trial_duration: Math.round(FIX_DUR * 1000)
    };
  }

  function memoryTrial(tr) {
    const html = pxSceneHTML(
      imgAt(tr.memL, POS_L_X, POS_Y) +
      imgAt(tr.memR, POS_R_X, POS_Y) +
      fixAtCenter()
    );
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: html,
      choices: "NO_KEYS",
      trial_duration: Math.round(MEM_DUR * 1000)
    };
  }

  function sendingTrial() {
    const durS = randFloat(SEND_MIN, SEND_MAX);
    const durMs = Math.round(durS * 1000);

    const html = `
      <div style="
        width:100vw;height:100vh;
        display:flex;align-items:center;justify-content:center;
        font-family:${FONT_FAMILY};color:#000;
      ">
        <div id="sendtxt" style="font-size:50px;font-weight:700;">对方正在发送......</div>
      </div>
    `;

    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: html,
      choices: "NO_KEYS",
      trial_duration: durMs,
      data: { _trial_type: "sending", sendDur: durS },
      on_load: () => {
        const el = document.getElementById("sendtxt");
        if (!el) return;
        let dots = 0;
        const timer = setInterval(() => {
          dots = (dots + 1) % 7;
          el.textContent = "对方正在发送" + ".".repeat(dots);
        }, 100);
        window.__sendTimer = timer;
      },
      on_finish: () => {
        if (window.__sendTimer) clearInterval(window.__sendTimer);
      }
    };
  }

  function cueTrial(tr) {
    const leftImg  = tr.cueSide === "left" ? tr.emojiPath : tr.stimPath;
    const rightImg = tr.cueSide === "left" ? tr.stimPath  : tr.emojiPath;

    const html = pxSceneHTML(
      imgAt(leftImg, POS_L_X, POS_Y) +
      imgAt(rightImg, POS_R_X, POS_Y) +
      fixAtCenter()
    );

    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: html,
      choices: "NO_KEYS",
      trial_duration: Math.round(CUE_DUR * 1000)
    };
  }

  function probeTrial(tr) {
    const x = tr.probeSide === "left" ? POS_L_X : POS_R_X;

    const html = pxSceneHTML(
      imgAt(tr.probeStim, x, POS_Y) +
      fixAtCenter()
    );

    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: html,
      choices: [SAME_KEY, DIFF_KEY, QUIT_KEY],
      trial_duration: Math.round(PROBE_MAX_RT * 1000),
      response_ends_trial: true,
      data: {
        _trial_type: "probe",
        condition: tr.condition,
        congruency: tr.congruency,
        cueSide: tr.cueSide,
        probeSide: tr.probeSide,
        isSame: tr.isSame,
        memL: tr.memL,
        memR: tr.memR,
        emoji_fn: tr.emoji_fn,
        stim_fn: tr.stim_fn,
        probeStim: tr.probeStim
      },
      on_finish: (data) => {
        let respKey = "";
        if (data.response !== null && data.response !== undefined) {
          if (typeof data.response === "number") {
            respKey = jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(data.response);
          } else {
            respKey = String(data.response);
          }
          respKey = respKey.toLowerCase();
        }

        if (respKey === QUIT_KEY) {
          downloadNow("ordered_partial");
          jsPsych.endExperiment("已退出（已下载当前数据）。");
          return;
        }

        const rt_s = (data.rt !== null && data.rt !== undefined) ? (data.rt / 1000.0) : "";

        let acc = 0;
        if (respKey) {
          if (tr.isSame === 1 && respKey === SAME_KEY) acc = 1;
          else if (tr.isSame === 0 && respKey === DIFF_KEY) acc = 1;
        }

        data.respKey = respKey;
        data.rt = rt_s;
        data.acc = acc;
      }
    };
  }

  function feedbackTrial() {
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: () => {
        const last = jsPsych.data.get().filter({ _trial_type: "probe" }).last(1).values()[0];
        const acc = last?.acc ?? 0;
        const txt = acc === 1 ? "恭喜你答对了！" : "很遗憾，你答错了。";
        return `
          <div style="
            width:100vw;height:100vh;
            display:flex;align-items:center;justify-content:center;
            font-family:${FONT_FAMILY};
          ">
            <div style="font-size:50px;font-weight:700;color:#000;">${txt}</div>
          </div>
        `;
      },
      choices: "NO_KEYS",
      trial_duration: 600
    };
  }

  function connectingTrial() {
    const durS = randFloat(CONNECT_MIN, CONNECT_MAX);
    const durMs = Math.round(durS * 1000);

    const html = `
      <div style="
        width:100vw;height:100vh;
        display:flex;align-items:center;justify-content:center;
        font-family:${FONT_FAMILY};color:#000;
      ">
        <div style="text-align:center;">
          <div id="conntxt" style="font-size:50px;font-weight:700;">正在与对方连接...</div>
          <div style="height:18px"></div>
          <div style="font-size:50px;font-weight:700;">请稍候</div>
        </div>
      </div>
    `;

    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: html,
      choices: [QUIT_KEY],
      trial_duration: durMs,
      response_ends_trial: true,
      data: { _trial_type: "connecting", dur: durS },
      on_load: () => {
        const el = document.getElementById("conntxt");
        if (!el) return;
        let dots = 0;
        const timer = setInterval(() => {
          dots = (dots + 1) % 4;
          el.textContent = "正在与对方连接" + ".".repeat(dots);
        }, 200);
        window.__connTimer = timer;
      },
      on_finish: (data) => {
        if (window.__connTimer) clearInterval(window.__connTimer);

        let respKey = "";
        if (data.response !== null && data.response !== undefined) {
          respKey = (typeof data.response === "number")
            ? jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(data.response)
            : String(data.response);
          respKey = respKey.toLowerCase();
        }
        if (respKey === QUIT_KEY) {
          downloadNow("ordered_partial");
          jsPsych.endExperiment("已退出（已下载当前数据）。");
        }
      }
    };
  }

  // ✅ FIXED HERE: instruction images are true fullscreen contain (no cropping)
  function instructionImageTrial(imgPath) {
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `
        <div style="
          width:100vw;height:100vh;
          display:flex;align-items:center;justify-content:center;
          background:rgb(128,128,128);
        ">
          <img src="${imgPath}" style="width:100vw;height:100vh;object-fit:contain;display:block;">
        </div>
      `,
      choices: [" ", QUIT_KEY],
      on_finish: (data) => {
        let respKey = "";
        if (data.response !== null && data.response !== undefined) {
          respKey = (typeof data.response === "number")
            ? jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(data.response)
            : String(data.response);
          respKey = respKey.toLowerCase();
        }
        if (respKey === QUIT_KEY) {
          downloadNow("ordered_partial");
          jsPsych.endExperiment("已退出（已下载当前数据）。");
        }
      }
    };
  }

  // ==============================
  // Demographics
  // ==============================
  const subjForm = {
    type: jsPsychSurveyHtmlForm,
    html: `
      <div style="font-family:${FONT_FAMILY};max-width:720px;margin:0 auto;text-align:left;color:#000">
        <h2 style="text-align:center;margin-top:0;font-size:42px;">实验信息（请填写）</h2>
        <div style="text-align:center;margin:10px 0 18px 0;font-size:16px;opacity:.85;">
          （无需鼠标）按 <b>Tab</b> 切换输入框，<b>↑/↓</b> 选择下拉项，按 <b>Enter</b> 提交
        </div>

        <p><label>被试编号/姓名（必填）：<br>
          <input id="field_name" name="name" type="text" required style="width:100%;padding:12px;font-size:18px">
        </label></p>

        <p><label>出生日期（YYYY-MM-DD）：<br>
          <input name="birthdate" type="date" required style="padding:12px;font-size:18px">
        </label></p>

        <p><label>性别：<br>
          <select name="gender" required style="padding:12px;font-size:18px">
            <option value="" selected disabled>请选择</option>
            <option value="F">F</option>
            <option value="M">M</option>
            <option value="Other">Other</option>
          </select>
        </label></p>

        <p><label>利手：<br>
          <select name="handedness" required style="padding:12px;font-size:18px">
            <option value="" selected disabled>请选择</option>
            <option value="Right">Right</option>
            <option value="Left">Left</option>
            <option value="Both">Both</option>
          </select>
        </label></p>

        <p style="text-align:center;margin-top:18px">
          <button type="submit" style="padding:12px 28px;font-size:18px">开始实验</button>
        </p>
      </div>
    `,
    on_load: () => {
      const first = document.getElementById("field_name");
      if (first) first.focus();

      document.addEventListener("keydown", function handler(e){
        if (e.key === "Enter") {
          const tag = (document.activeElement && document.activeElement.tagName || "").toLowerCase();
          if (tag === "select") return;
          const form = document.querySelector(".jspsych-content form");
          if (form) form.requestSubmit();
        }
      }, { once: false });
    },
    on_finish: (data) => {
      const r = data.response || {};
      window.__subj = {
        name: r.name || "",
        birthdate: r.birthdate || "",
        gender: r.gender || "",
        handedness: r.handedness || ""
      };
    }
  };

  // ==============================
  // Build block timeline
  // ==============================
  function buildBlockTimeline(trials, isPractice, blockName) {
    const tl = [];

    for (let i = 0; i < trials.length; i++) {
      const tr = trials[i];

      tl.push(fixationTrial());
      tl.push(memoryTrial(tr));
      tl.push(sendingTrial());
      tl.push(cueTrial(tr));
      tl.push(probeTrial(tr));
      if (isPractice) tl.push(feedbackTrial());

      tl.push({
        type: jsPsychHtmlKeyboardResponse,
        stimulus: "",
        choices: "NO_KEYS",
        trial_duration: 0,
        on_finish: () => {
          const subj = window.__subj || { name:"", birthdate:"", gender:"", handedness:"" };
          const lastProbe = jsPsych.data.get().filter({ _trial_type: "probe" }).last(1).values()[0];
          const lastSend  = jsPsych.data.get().filter({ _trial_type: "sending" }).last(1).values()[0];

          window.__rows.push({
            name: subj.name,
            birthdate: subj.birthdate,
            gender: subj.gender,
            handedness: subj.handedness,

            block: blockName,
            trial: i + 1,
            isPractice: isPractice ? 1 : 0,

            condition: tr.condition,
            congruency: tr.congruency,
            cueSide: tr.cueSide,
            probeSide: tr.probeSide,
            isSame: tr.isSame,

            memL: tr.memL,
            memR: tr.memR,
            emoji_fn: tr.emoji_fn,
            stim_fn: tr.stim_fn,
            probeStim: tr.probeStim,

            respKey: lastProbe?.respKey ?? "",
            rt: lastProbe?.rt ?? "",
            acc: lastProbe?.acc ?? 0,
            sendDur: lastSend?.sendDur ?? ""
          });
        }
      });
    }

    return tl;
  }

  // ==============================
  // Preload
  // ==============================
  const preloadList = [
    ...Object.values(INSTR),
    ...MEM_POOL,
    ...CUE_PAIRS.flat()
  ];

  const preload = {
    type: jsPsychPreload,
    images: preloadList,
    show_progress_bar: true,
    error_message: "资源加载失败，请检查网络或稍后重试。",
  };

  // ==============================
  // Init jsPsych
  // ==============================
  const jsPsych = initJsPsych({
  display_element: "exp-scale-wrap",
    on_finish: () => {
      downloadNow("ordered");
      jsPsych.displayElement.innerHTML = `
        <div style="
          width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;
          font-family:${FONT_FAMILY};
        ">
          <div style="text-align:center;color:#000;">
            <div style="font-size:44px;font-weight:800;">实验已结束，数据已下载。</div>
            <div style="height:12px"></div>
            <div style="font-size:26px;font-weight:700;">请将 CSV 文件发送给实验员。</div>
          </div>
        </div>
      `;
    }
  });

  window.__rows = [];
  window.__subj = null;

  // ==============================
  // Practice loop
  // ==============================
  const practiceNode = {
    timeline: [
      instructionImageTrial(INSTR.practice_intro),
      connectingTrial(),
      ...buildBlockTimeline(makeTrials(N_PRACTICE, 0.60, 0.50), true, "practice"),
    ],
    loop_function: () => {
      const last = jsPsych.data.get().filter({ _trial_type: "probe" }).last(N_PRACTICE).values();
      const acc = last.reduce((s, x) => s + (x.acc || 0), 0) / N_PRACTICE;

      if (acc >= PASS_CRITERION) return false;

      jsPsych.addNodeToEndOfTimeline(instructionImageTrial(INSTR.practice_fail), jsPsych.resumeExperiment);
      return true;
    }
  };

  // ==============================
  // Master timeline
  // ==============================
  const timeline = [];

  timeline.push(preload);
  timeline.push({ type: jsPsychFullscreen, fullscreen_mode: true });

  timeline.push(instructionImageTrial(INSTR.welcome));
  timeline.push(instructionImageTrial(INSTR.procedure));

  timeline.push(subjForm);

  timeline.push(practiceNode);

  timeline.push(instructionImageTrial(INSTR.formal_intro));

  timeline.push(connectingTrial());
  timeline.push(...buildBlockTimeline(makeTrials(N_BLOCK1, 0.60, 0.50), false, "formalBlock1"));

  timeline.push(instructionImageTrial(INSTR.break));

  timeline.push(connectingTrial());
  timeline.push(...buildBlockTimeline(makeTrials(N_BLOCK2, 0.60, 0.50), false, "formalBlock2"));

  timeline.push(instructionImageTrial(INSTR.end));

  jsPsych.run(timeline);

})();
