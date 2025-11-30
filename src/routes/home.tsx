import { useContext } from "preact/hooks";
import { ConnectionContext } from "../connection.ts";

export const Home = () => {
  const connection = useContext(ConnectionContext);
  async function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const result = await connection?.connect(formData.get("name") as string);
    if (!result) {
      console.log("show error");
    }
  }
  return (
    <div class="mx-auto max-w-[300px] border rounded py-3 px-4">
      <h1>Join the lobby</h1>
      <form method="post" action="/api/join" onSubmit={onSubmit}>
        <label class="text-sm text-gray-100">
          Name:
          <input
            class="border px-1 py-1 rounded block w-full text-base"
            type="text"
            name="name"
          />
        </label>
        <input
          class="py-1 px-4 rounded bg-emerald-300 text-gray-900 my-2 text-base"
          type="submit"
          value="Join"
        />
      </form>
    </div>
  );
};
