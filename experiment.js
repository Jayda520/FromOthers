(() => {
  "use strict";

  // ==============================
  // Paths (match your current repo)
  // ==============================
  const PATHS = {
    instruction: "InstructionImages",
    memory: "MemoryStimuli",
    cue: "CueStimuli",
  };

  // ==============================
  // Params (timing & keys)
  // ==============================
  const FONT_FAMILY =
    '"Microsoft YaHei UI","Microsoft YaHei","PingFang SC","Noto Sans CJK SC",sans-serif';

  const SAME_KEY = "j";
  const DIFF_KEY = "f";

  const N_PRACTICE = 15;
  const N_BLOCK1 = 80;
  const N_BLOCK2 = 80;

  const PASS_CRITERION = 0.75;

  const FIX_DUR = 1000;      // ms  注视点
  const MEM_DUR = 500;       // ms  记忆刺激
  const CUE_DUR = 1000;      // ms  emoji+复杂刺激呈现
  const PROBE_MAX_RT = 3000; // ms  探测最大反应时

  const CONNECT_MIN = 5000, CONNECT_MAX = 15000; // ms 连接页随机
  const SEND_MIN = 200, SEND_MAX = 1500;         // ms 发送页随机

  const IMG_W = 194, IMG_H = 194; // 你指定的像素尺寸

  // ==============================
  // Stimuli pools
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

  const CUE_PAIRS = [
    ["anger.png",     "stim_0001_anger.png"],
    ["calmness.png",  "stim_circular-041_calmness.png"],
    ["disgust.png",   "stim_dim1-074_disgust.png"],
    ["fear.png",      "stim_dim2-fear.png"],
    ["happiness.png", "stim_0262_happiness.png"],
    ["sadness.png",   "stim_0806_sadness.png"],
    ["surprise.png",  "stim_0889_surprise.png"],
  ].map(([emoji, stim]) => [`${PATHS.cue}/${emoji}`, `${PATHS.cue}/${stim}`]);

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
  // Ordered fields (csv)
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

  /**
   * condition: 50% emoji / 50% complexStimulus（按 trial 级别分配）
   * congruency: 在每个 condition 内独立分配 congRatio（默认 0.60）
   * isSame: 50% same / 50% different
   */
  function makeTrials(nTrials, congRatio = 0.60, condRatio = 0.50) {
    const condFlags = makeFlagsRatio(nTrials, condRatio); // 1=emoji,0=complex
    const nEmoji = condFlags.reduce((s, x) => s + x, 0);
    const nComp = nTrials - nEmoji;

    const congEmoji = makeFlagsRatio(nEmoji, congRatio);
    const congComp  = makeFlagsRatio(nComp, congRatio);
    const sameFlags = makeFlagsRatio(nTrials, 0.50);

    let idxE = 0, idxC = 0;
    const trials = [];

    for (let i = 0; i < nTrials; i++) {
      // 记忆刺激：从7张里抽2张（每个 trial 都是随机抽取）
      const memPick = shuffle(MEM_POOL).slice(0, 2);
      let memL = memPick[0], memR = memPick[1];
      if (Math.random() >= 0.5) [memL, memR] = [memR, memL];

      // cue pair：7个情绪对随机选一对（每个 trial 随机）
      const [emojiPath, stimPath] = choice(CUE_PAIRS);

      // cue side：emoji 在左或右随机
      const cueSide = Math.random() < 0.5 ? "left" : "right";

      // condition：trial 级别按 condFlags 分配（50/50）
      const condition = condFlags[i] === 1 ? "emoji" : "complexStimulus";

      // congruency：在各自 condition 内按比例分配（默认 60% congruent）
      const congFlag = (condition === "emoji") ? congEmoji[idxE++] : congComp[idxC++];
      const congruency = congFlag === 1 ? "congruent" : "incongruent";

      const opposite = cueSide === "left" ? "right" : "left";

      // probeSide 规则（你原逻辑保留不动）：
      // - emoji条件：congruent -> probe 在 emoji side；incongruent -> probe 在 opposite
      // - complexStimulus条件：congruent -> probe 在 opposite；incongruent -> probe 在 cueSide
      let probeSide;
      if (condition === "emoji") {
        probeSide = (congFlag === 1) ? cueSide : opposite;
      } else {
        probeSide = (congFlag === 1) ? opposite : cueSide;
      }

      // same/diff（50/50）
      const isSame = sameFlags[i]; // 1=same
      let probeStim;
      if (isSame === 1) {
        probeStim = (probeSide === "left") ? memL : memR;
      } else {
        const remain = MEM_POOL.filter(x => x !== memL && x !== memR);
        probeStim = choice(remain);
      }

      const emoji_fn = emojiPath.split("/").pop();
      const stim_fn  = stimPath.split("/").pop();

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
  // Layout HTML helpers
  // ==============================
  function makeCenteredHTML(html) {
    // 注意：页面背景灰色由 index.html 控制更稳；这里仅保证居中与字体
    return `
      <div style="
        width:100vw;height:100vh;
        display:flex;align-items:center;justify-content:center;
        font-family:${FONT_FAMILY};
        color:#000;
      ">
        <div style="text-align:center;">
          ${html}
        </div>
      </div>`;
  }

  // ✅ “+”单独注视点（PsychoPy 的 fixation）
  function fixationTrial(durationMs) {
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: makeCenteredHTML(`<div style="font-size:64px;font-weight:800;line-height:1;">+</div>`),
      choices: "NO_KEYS",
      trial_duration: durationMs
    };
  }

  // ✅ 三列布局：左图 + 中间“+” + 右图（同一行）
  function dualImageWithFix(memL, memR, durationMs) {
    const html = `
      <div style="display:flex;align-items:center;justify-content:center;gap:90px;">
        <div style="width:${IMG_W}px;height:${IMG_H}px;display:flex;align-items:center;justify-content:center;">
          <img src="${memL}" width="${IMG_W}" height="${IMG_H}">
        </div>

        <div style="font-size:64px;font-weight:800;line-height:1;">+</div>

        <div style="width:${IMG_W}px;height:${IMG_H}px;display:flex;align-items:center;justify-content:center;">
          <img src="${memR}" width="${IMG_W}" height="${IMG_H}">
        </div>
      </div>
    `;
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: makeCenteredHTML(html),
      choices: "NO_KEYS",
      trial_duration: durationMs
    };
  }

  // ✅ sending 动态页（随机 200–1500ms）
  function sendingTrial() {
    const sendDur = Math.round(randFloat(SEND_MIN, SEND_MAX));
    const html = `<div style="font-size:44px;font-weight:800;" id="sendtxt">对方正在发送......</div>`;
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: makeCenteredHTML(html),
      choices: "NO_KEYS",
      trial_duration: sendDur,
      data: { _trial_type: "sending", sendDur },
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

  // ✅ cue 页：emoji + complex 同屏（1000ms），中间有“+”
  function cueWithFix(tr) {
    const leftImg  = tr.cueSide === "left" ? tr.emojiPath : tr.stimPath;
    const rightImg = tr.cueSide === "left" ? tr.stimPath  : tr.emojiPath;

    const html = `
      <div style="display:flex;align-items:center;justify-content:center;gap:90px;">
        <div style="width:${IMG_W}px;height:${IMG_H}px;display:flex;align-items:center;justify-content:center;">
          <img src="${leftImg}" width="${IMG_W}" height="${IMG_H}">
        </div>

        <div style="font-size:64px;font-weight:800;line-height:1;">+</div>

        <div style="width:${IMG_W}px;height:${IMG_H}px;display:flex;align-items:center;justify-content:center;">
          <img src="${rightImg}" width="${IMG_W}" height="${IMG_H}">
        </div>
      </div>
    `;
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: makeCenteredHTML(html),
      choices: "NO_KEYS",
      trial_duration: CUE_DUR
    };
  }

  // ✅ probe 页：永远三列占位，probe 只出现在一侧；不显示任何按键提示文字
  function probeTrial(tr) {
    const leftBox = tr.probeSide === "left"
      ? `<img src="${tr.probeStim}" width="${IMG_W}" height="${IMG_H}">`
      : ``;

    const rightBox = tr.probeSide === "right"
      ? `<img src="${tr.probeStim}" width="${IMG_W}" height="${IMG_H}">`
      : ``;

    const html = `
      <div style="display:flex;align-items:center;justify-content:center;gap:90px;">
        <div style="width:${IMG_W}px;height:${IMG_H}px;display:flex;align-items:center;justify-content:center;">
          ${leftBox}
        </div>

        <div style="font-size:64px;font-weight:800;line-height:1;">+</div>

        <div style="width:${IMG_W}px;height:${IMG_H}px;display:flex;align-items:center;justify-content:center;">
          ${rightBox}
        </div>
      </div>
    `;

    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: makeCenteredHTML(html),
      choices: [SAME_KEY, DIFF_KEY],
      trial_duration: PROBE_MAX_RT,
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
        probeStim: tr.probeStim,
      },
      on_finish: (data) => {
        const responded = data.response !== null && data.response !== undefined;
        const respKey = responded ? String(data.response) : "";
        const rt = responded ? data.rt : "";

        let acc = 0;
        if (responded) {
          if (tr.isSame === 1 && respKey === SAME_KEY) acc = 1;
          else if (tr.isSame === 0 && respKey === DIFF_KEY) acc = 1;
        }

        data.respKey = respKey;
        data.acc = acc;
        data.rt = rt;
      }
    };
  }

  // ✅ connecting 动态页（随机 5–15s）
  function connectingTrial() {
    const dur = Math.round(randFloat(CONNECT_MIN, CONNECT_MAX));
    const html = `
      <div style="font-size:44px;font-weight:800;" id="conntxt">正在与对方连接...</div>
      <div style="height:18px"></div>
      <div style="font-size:36px;font-weight:800;">请稍候</div>
    `;
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: makeCenteredHTML(html),
      choices: "NO_KEYS",
      trial_duration: dur,
      data: { _trial_type: "connecting", dur },
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
      on_finish: () => {
        if (window.__connTimer) clearInterval(window.__connTimer);
      }
    };
  }

  // instruction pages：空格继续
  function instructionImageTrial(imgPath) {
    return {
      type: jsPsychImageKeyboardResponse,
      stimulus: imgPath,
      choices: [" "],
      prompt: "",
      render_on_canvas: false
    };
  }

  // practice feedback：600ms
  function feedbackTrial() {
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: () => {
        const last = jsPsych.data.get().last(1).values()[0];
        const acc = last?.acc ?? 0;
        const txt = acc === 1 ? "恭喜你答对了！" : "很遗憾，你答错了。";
        return makeCenteredHTML(`<div style="font-size:44px;font-weight:800;">${txt}</div>`);
      },
      choices: "NO_KEYS",
      trial_duration: 600
    };
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

  // ==============================
  // Build trials timeline
  // ==============================
  function buildTrialsTimeline(trials, isPractice, blockName) {
    const timeline = [];

    for (let i = 0; i < trials.length; i++) {
      const tr = trials[i];

      timeline.push(fixationTrial(FIX_DUR));
      timeline.push(dualImageWithFix(tr.memL, tr.memR, MEM_DUR));
      timeline.push(sendingTrial());
      timeline.push(cueWithFix(tr));
      timeline.push(probeTrial(tr));
      if (isPractice) timeline.push(feedbackTrial());

      // write one ordered row
      timeline.push({
        type: jsPsychHtmlKeyboardResponse,
        stimulus: makeCenteredHTML(`<div style="opacity:0">.</div>`),
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

    return timeline;
  }

  // ==============================
  // jsPsych init
  // ==============================
  const jsPsych = initJsPsych({
    on_finish: () => {
      const subj = window.__subj || {};
      const safeName = (subj.name || "NA").trim().replace(/\s+/g, "_") || "NA";
      const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
      const filename = `${safeName}_EmojiSocial_${stamp}_ordered.csv`;

      const csvText = rowsToOrderedCSV(window.__rows);
      downloadCSV(filename, csvText);

      jsPsych.displayElement.innerHTML = makeCenteredHTML(
        `<div style="font-size:44px;font-weight:900;">实验已结束，数据文件已自动下载。</div>
         <div style="height:18px"></div>
         <div style="font-size:32px;font-weight:800;">请将下载的 CSV 文件发送给实验员。</div>`
      );
    }
  });

  window.__rows = [];
  window.__subj = null;

  // ==============================
  // Participant form (keyboard-first, no mouse needed)
  // ==============================
  const subjForm = {
    type: jsPsychSurveyHtmlForm,
    html: `
      <div style="font-family:${FONT_FAMILY};max-width:720px;margin:0 auto;text-align:left;color:#000">
        <h2 style="text-align:center;margin-top:0;font-size:40px;">实验信息（请填写）</h2>

        <div style="text-align:center;margin:10px 0 18px 0;font-size:16px;opacity:.85;">
          <b>无需鼠标</b>：按 <b>Tab</b> 切换输入框，<b>↑/↓</b> 选择下拉项，按 <b>Enter</b> 继续
        </div>

        <p><label>被试编号/姓名（必填）：<br>
          <input id="field_name" name="name" type="text" required
                 style="width:100%;padding:12px;font-size:18px">
        </label></p>

        <p><label>出生日期：<br>
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
          <button type="submit" style="padding:12px 28px;font-size:18px">开始实验（Enter）</button>
        </p>
      </div>
    `,
    on_load: () => {
      const first = document.getElementById("field_name");
      if (first) first.focus();

      // Enter 提交（select 上 Enter 常用于确认选项，所以 select 时不强推提交）
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
      const resp = data.response || {};
      window.__subj = {
        name: resp.name || "",
        birthdate: resp.birthdate || "",
        gender: resp.gender || "",
        handedness: resp.handedness || ""
      };
    }
  };

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
  // Practice loop node (repeat until pass)
  // ==============================
  const practiceNode = {
    timeline: [
      instructionImageTrial(INSTR.practice_intro),
      connectingTrial(),
      ...buildTrialsTimeline(makeTrials(N_PRACTICE, 0.60, 0.50), true, "practice")
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
  const masterTimeline = [];

  masterTimeline.push(preload);
  masterTimeline.push({ type: jsPsychFullscreen, fullscreen_mode: true });

  masterTimeline.push(instructionImageTrial(INSTR.welcome));
  masterTimeline.push(instructionImageTrial(INSTR.procedure));

  masterTimeline.push(subjForm);

  masterTimeline.push(practiceNode);

  masterTimeline.push(instructionImageTrial(INSTR.formal_intro));

  masterTimeline.push(connectingTrial());
  masterTimeline.push(...buildTrialsTimeline(makeTrials(N_BLOCK1, 0.60, 0.50), false, "formalBlock1"));

  masterTimeline.push(instructionImageTrial(INSTR.break));

  masterTimeline.push(connectingTrial());
  masterTimeline.push(...buildTrialsTimeline(makeTrials(N_BLOCK2, 0.60, 0.50), false, "formalBlock2"));

  masterTimeline.push(instructionImageTrial(INSTR.end));

  jsPsych.run(masterTimeline);

})();
