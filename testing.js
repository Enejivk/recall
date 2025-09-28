const response = {
  questions: [
    {
      question:
        "What does the maxTokens parameter control in the ChatAnthropic configuration?",
      answer:
        "It controls the maximum number of tokens the model is allowed to generate in its response.",
      hasCode: false,
    },
    {
      question:
        "What happens if you leave maxTokens undefined in the configuration?",
      answer:
        "The library will defer to the model’s default maximum token limit.",
      hasCode: false,
    },
    {
      question:
        "Why does TypeScript throw an error when maxTokens: undefined is used with exactOptionalPropertyTypes enabled?",
      answer:
        "Because maxTokens?: number means the property can be omitted, but explicitly assigning undefined is not allowed.",
      hasCode: false,
    },
    {
      question:
        "What is the correct way to avoid the error if you don’t want to set maxTokens?",
      answer: "Omit the maxTokens property entirely from the configuration.",
      hasCode: true,
    },
    {
      question:
        "Why might it be useful to open an issue in the LangChain repo regarding maxTokens?",
      answer:
        "Because the docs show maxTokens: undefined, which causes a type error in strict TypeScript projects, so the docs or types should be updated.",
      hasCode: false,
    },
    {
      question:
        "What is the difference between maxTokens?: number and maxTokens: number | undefined under exactOptionalPropertyTypes?",
      answer:
        "maxTokens?: number allows omission but not explicit undefined, while maxTokens: number | undefined requires the property but allows undefined as a value.",
      hasCode: false,
    },
  ],
};

response.questions.forEach((q, index) => {
  console.log(index)

  
  console.log()
});
