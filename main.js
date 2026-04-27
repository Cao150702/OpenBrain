const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
const smoothstep = (edge0, edge1, value) => {
  const t = clamp((value - edge0) / (edge1 - edge0 || 1));
  return t * t * (3 - 2 * t);
};

const showcase = document.querySelector("[data-showcase]");
const stageObject = document.querySelector("[data-stage-object]");
const progressFill = document.querySelector("[data-progress-fill]");
const toast = document.getElementById("toast");

let rafId = 0;

const getStageBounds = () => {
  if (!showcase) return { start: 0, end: 1, distance: 1 };
  const rect = showcase.getBoundingClientRect();
  const start = window.scrollY + rect.top;
  const distance = Math.max(showcase.offsetHeight - window.innerHeight, 1);
  const end = start + distance;
  return { start, end, distance };
};

const applyStage = (progress) => {
  if (!stageObject) return;

  const morph = smoothstep(0.06, 0.34, progress);
  const flip = smoothstep(0.56, 0.9, progress);
  const copyReveal = smoothstep(0.26, 0.48, progress);
  const mobileCardScale = 1.14 - copyReveal * 0.1;

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
  stageObject.style.setProperty("--mobile-card-scale", mobileCardScale.toFixed(3));

  if (progressFill) {
    progressFill.style.width = `${(progress * 100).toFixed(1)}%`;
  }

  if (showcase) {
    showcase.style.setProperty("--copy-reveal", copyReveal.toFixed(3));
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
