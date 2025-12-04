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
    <form
      class="mx-auto max-w-md px-4"
      method="post"
      action="/api/join"
      onSubmit={onSubmit}
    >
      <div class="bg-white text-gray-900 rounded shadow-[4px_4px_0] shadow-gray-600">
        <h1 class="py-3 border-b border-gray-500 px-4">Join the lobby</h1>
        <div class="px-4 pt-3 pb-5">
          <label class="text-sm text-gray-800">
            <span class="block pb-1">Name:</span>
            <input
              class="border border-gray-500 px-1 py-1 rounded block w-full text-base shadow-[2px_2px_0] shadow-gray-600"
              type="text"
              name="name"
            />
          </label>
        </div>
      </div>
      <input
        class="mt-4 py-2 px-4 rounded bg-white text-gray-900 my-2 text-base shadow-[4px_4px_0] shadow-gray-600"
        type="submit"
        value="Join"
      />
    </form>
  );
};
