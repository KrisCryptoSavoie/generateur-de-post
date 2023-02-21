import {
  Observable,
  BehaviorSubject,
  map,
  tap,
  switchMap,
  fromEvent,
} from "rxjs";
import { ajax } from "rxjs/ajax";

const OPENAI_API_KEY = "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";

const form = document.querySelector<HTMLFormElement>("form")!;
const statut = document.querySelector<HTMLInputElement>("#statut")!;
const post = document.querySelector<HTMLInputElement>("#post")!;
const resultScreen = document.querySelector<HTMLElement>("#result")!;
const submitButton = document.querySelector<HTMLButtonElement>("button")!;
const copyButton = document.querySelector<HTMLButtonElement>("#copy")!;

copyButton.addEventListener("click", () => {
  navigator.clipboard.writeText(resultScreen.textContent!);
});

const disableForm = (state: boolean) => {
  form.ariaDisabled = state.toString();
  statut.disabled = state;
};

const setLoadingButton = (state: boolean) => {
  submitButton.setAttribute("aria-busy", state.toString());
  submitButton.disabled = state;
};

const setLoadingResult = (state: boolean) => {
  resultScreen.setAttribute("aria-busy", state.toString());

  if (state === true) {
    resultScreen.innerHTML =
      "En cours de création";
  }
};

const generateOpenAIPrompt = () => {

  const prompt = `${statut.value} ${type.value} ${post.value}
  `;

  return prompt;
};

type OpenAIResponse = {
  choices: {
    text: string;
  }[];
};

const extractAndConvertOpenAIText = (data: OpenAIResponse) =>
  data.choices[0].text
    .split("\n")
    .map((str) => `<p>${str}</p>`)
    .join("");

const isLoading$ = new BehaviorSubject(false);

const completions$ = fromEvent<SubmitEvent>(form, "submit").pipe(
  tap(() => (copyButton.style.display = "none")),
  tap((e) => e.preventDefault()),
  map(() => generateOpenAIPrompt()),
  tap(() => isLoading$.next(true)),
  switchMap((prompt) =>
    ajax<OpenAIResponse>({
      url: "https://api.openai.com/v1/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: {
        prompt,
        max_tokens: 2000,
        model: "text-davinci-003",
      },
    }).pipe(
      map((response) => response.response),
      map((data) => extractAndConvertOpenAIText(data))
    )
  ),
  tap(() => isLoading$.next(false))
);

completions$.subscribe((html) => {
  copyButton.style.display = "block";
  resultScreen.innerHTML = html;
});

isLoading$.subscribe((state) => {
  disableForm(state);
  setLoadingButton(state);
  setLoadingResult(state);
});
