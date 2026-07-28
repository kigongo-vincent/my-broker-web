import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { GoogleMark } from "./Index";
import { Post } from "../../../api";
import { UserI, useUserStore } from "../../store/auth";
import { useNavigate } from "react-router";
import Logo from "../../components/base/Logo";

interface GoogleRequest {
    code: string | undefined | null
    state: string | number | undefined | null
}

interface GoogleAuthResponse {
    token: string;
    user: UserI; // replace with your User type
}

const Google = () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");
    const { login } = useUserStore()
    const navigate = useNavigate()
    const { mutate, isPending, isError, isSuccess } = useMutation({
        mutationFn: (body: GoogleRequest) =>
            Post<GoogleRequest, GoogleAuthResponse>("users/auth/google/callback", body),
        onSuccess: (res) => {
            // saveAuthToken(res.data.token);
            // saveUser(res.data.user);
            login(res.data)
            navigate("/tabs/user");
        },
        onError: (err) => {
            console.log("google auth failed:", err);
        },
    });

    useEffect(() => {
        if (error) {
            console.log(`error: ${error}`);
            return;
        }
        if (!code) return;

        mutate({ code, state });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentionally run once - code/state come from the URL, not props/state

    return (
        <div className="h-screen p-4 flex flex-col gap-3 items-center justify-center">
            <div className="flex items-center gap-3 bg-pale p-4 rounded-2xl pr-2">
                <div className="transform scale-150">
                    <GoogleMark />
                </div>
                <Logo className="h-16" />
            </div>
            <span className="text-text/50 ">
                {isPending && "Google auth in progress..."}
                {isError && "Something went wrong, please try again."}
                {isSuccess && "Success, redirecting..."}
            </span>
            <button onClick={() => navigate("/auth")} className="btn bg-pale rounded-full w-full ">
                back to home
            </button>
        </div>
    )
}

export default Google