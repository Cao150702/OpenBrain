const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
const smoothstep = (edge0, edge1, value) => {
  const t = clamp((value - edge0) / (edge1 - edge0 || 1));
  return t * t * (3 - 2 * t);
};

const showcase = document.querySelector("[data-showcase]");
const stageObject = document.querySelector("[data-stage-object]");
const progressFill = document.querySelector("[data-progress-fill]");
const phaseChips = Array.from(document.querySelectorAll("[data-phase-chip]"));
const toast = document.getElementById("toast");

const PHASE_TEXT = {
  blueprint: "阶段 1 / 图纸切换为实物",
  material: "阶段 2 / 正面稳定展示",
  reverse: "阶段 3 / 翻到背面",
};

const PHASE_SCROLL = {
  blueprint: 0.1,
  material: 0.42,
  reverse: 0.86,
};

let rafId = 0;

const getStageBounds = () => {
  if (!showcase) return { start: 0, end: 1, distance: 1 };
  const rect = showcase.getBoundingClientRect();
  const start = window.scrollY + rect.top;
  const distance = Math.max(showcase.offsetHeight - window.innerHeight, 1);
  const end = start + distance;
  return { start, end, distance };
};

const setPhase = (phase) => {
  phaseChips.forEach((chip) => {
    chip.classList.toggle("is-active", chip.dataset.phaseChip === phase);
  });
};

const applyStage = (progress) => {
  if (!stageObject) return;

  const morph = smoothstep(0.06, 0.34, progress);
  const hold = smoothstep(0.34, 0.52, progress);
  const flip = smoothstep(0.56, 0.9, progress);

  const blueprintAlpha = 1 - morph;
  const cardAlpha = morph;
  const turn = `${flip * 180}deg`;
  const frontOpacity = flip < 0.5 ? 1 : 0;
  const backOpacity = flip >= 0.5 ? 1 : 0;

  stageObject.style.setProperty("--blueprint-alpha", blueprintAlpha.toFixed(3));
  stageObject.style.setProperty("--card-alpha", cardAlpha.toFixed(3));
  stageObject.style.setProperty("--turn", turn);
  stageObject.style.setProperty("--front-face-opacity", `${frontOpacity}`);
  stageObject.style.setProperty("--back-face-opacity", `${backOpacity}`);

  if (progressFill) {
    progressFill.style.width = `${(progress * 100).toFixed(1)}%`;
  }

  if (progress < 0.34) {
    setPhase("blueprint");
  } else if (progress < 0.56 || hold < 1) {
    setPhase("material");
  } else {
    setPhase("reverse");
  }
};

const renderFromScroll = () => {
  rafId = 0;
  if (!showcase) return;

  const { start, distance } = getStageBounds();
  const rawProgress = (window.scrollY - start) / distance;
  const progress = clamp(rawProgress);
  applyStage(progress);
};

const requestRender = () => {
  if (rafId) return;
  rafId = window.requestAnimationFrame(renderFromScroll);
};

window.addEventListener("scroll", requestRender, { passive: true });
window.addEventListener("resize", requestRender);
window.addEventListener("load", requestRender);

phaseChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    if (!showcase) return;
    const phase = chip.dataset.phaseChip;
    if (!phase || !(phase in PHASE_SCROLL)) return;
    const { start, distance } = getStageBounds();
    const targetY = start + distance * PHASE_SCROLL[phase];
    window.scrollTo({ top: targetY, behavior: "smooth" });
  });
});

const showToast = (message) => {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
};

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const text = button.dataset.copy || "";

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      showToast("已复制到剪贴板");
    } catch (error) {
      showToast("复制失败，请手动复制");
    }
  });
});
